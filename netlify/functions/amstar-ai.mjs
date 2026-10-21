import {createSign} from 'node:crypto';
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const env=k=>Netlify.env.get(k)||"";
let cache={until:0,emails:null};
export async function rosterFromSheet(){
 if(cache.emails&&Date.now()<cache.until)return cache.emails;
 const email=env("GOOGLE_SERVICE_ACCOUNT_EMAIL"),key=env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g,"\n"),id=env("AMSTAR_SHEET_ID");
 if(!email||!key||!id)throw Error("Google Sheets credentials missing");
 const t=Math.floor(Date.now()/1000),enc=v=>Buffer.from(JSON.stringify(v)).toString("base64url");
 const head=enc({alg:"RS256",typ:"JWT"}),body=enc({iss:email,scope:"https://www.googleapis.com/auth/spreadsheets.readonly",aud:"https://oauth2.googleapis.com/token",iat:t,exp:t+3000});
 const signer=createSign("RSA-SHA256");signer.update(head+"."+body);signer.end();
 const assertion=head+"."+body+"."+signer.sign(key,"base64url");
 const token=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion}),signal:AbortSignal.timeout(9000)});
 if(!token.ok)throw Error("Sheets login failed");
 const access=(await token.json()).access_token;
 const url="https://sheets.googleapis.com/v4/spreadsheets/"+encodeURIComponent(id)+"/values/"+encodeURIComponent("'Página1'!B2:B1000");
 const r=await fetch(url,{headers:{authorization:"Bearer "+access},signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error("Sheets read failed");
 const set=new Set(((await r.json()).values||[]).flat().map(x=>String(x).trim().toLowerCase()).filter(x=>/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(x)));
 if(!set.size)throw Error("Roster is empty");
 cache={emails:set,until:Date.now()+60000};return set;
}
export async function authenticateGoogle(req){
 const clientId=env("GOOGLE_CLIENT_ID"),token=(req.headers.get("authorization")||"").replace(/^Bearer\\s+/i,"").trim();
 if(!clientId)return {error:"OAuth não configurado",status:503};
 if(!token||token.length>6000)return {error:"Login obrigatório",status:401};
 try{
 const r=await fetch("https://oauth2.googleapis.com/tokeninfo?id_token="+encodeURIComponent(token),{signal:AbortSignal.timeout(8000)});
 if(!r.ok)return {error:"Login inválido",status:401};
 const u=await r.json(),email=String(u.email||"").trim().toLowerCase();
 if(u.aud!==clientId||String(u.email_verified)!=="true"||!email)return {error:"E-mail Google não verificado",status:401};
 const teachers=env("AMSTAR_TEACHER_EMAILS").toLowerCase().split(/[;,\\s]+/).filter(Boolean);
 const roster=await rosterFromSheet(),teacher=teachers.includes(email);
 return teacher||roster.has(email)?{email,teacher}:{error:"E-mail não autorizado",status:403};
 }catch{return {error:"Verificação da matrícula indisponível",status:503};}
}
export default async req=>{
 if(req.method==="GET")return json({available:!!(env("OPENAI_API_KEY")&&env("GOOGLE_CLIENT_ID")&&env("GOOGLE_SERVICE_ACCOUNT_EMAIL")&&env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")&&env("AMSTAR_SHEET_ID")),clientId:env("GOOGLE_CLIENT_ID")||null,authType:"google",rosterSource:"google-sheets"});
 if(req.method!=="POST")return json({error:"Método inválido"},405);
 const user=await authenticateGoogle(req);if(user.error)return json({error:user.error},user.status);
 if(!env("OPENAI_API_KEY"))return json({error:"Chave OpenAI não configurada"},503);
 let x;try{x=await req.json()}catch{return json({error:"JSON inválido"},400)}
 if(!Array.isArray(x.pages)||x.pages.length>200)return json({error:"Páginas inválidas"},400);
 const pageMap=new Map(x.pages.filter(p=>Number.isInteger(p.page)&&typeof p.text==="string").map(p=>[p.page,p.text]));
 const text=[...pageMap].map(([p,t])=>"[PÁGINA "+p+"] "+t.slice(0,10000)).join("\n");
 if(text.length<1500||text.length>115000)return json({error:"O documento exige OCR ou segmentação antes da análise"},422);
 const system='Avalie AMSTAR 2 para revisões sistemáticas de intervenções. Responda JSON {"items":[16 objetos]} com item (1-16), choice (yes,partial,no,na,unclear), page (inteiro ou null), evidence (trecho literal da página), note (justificativa PT-BR), confidence (low,medium,high). Não invente evidências. Use unclear se falta evidência. Domínios críticos: 2,4,7,9,11,13,15. partial somente 2,4,7,8,9. na só 11,12,15 sem metanálise. Julgamentos são preliminares.';
 try{
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),48000);
 let r;try{r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{authorization:"Bearer "+env("OPENAI_API_KEY"),"content-type":"application/json"},body:JSON.stringify({model:env("OPENAI_MODEL")||"gpt-4.1-mini",temperature:0,response_format:{type:"json_object"},max_tokens:5000,messages:[{role:"system",content:system},{role:"user",content:JSON.stringify({title:x.title,doi:x.doi,meta:x.meta,text})}]}),signal:ctrl.signal});}finally{clearTimeout(timeout)}
 if(!r.ok)return json({error:"Serviço de IA indisponível (HTTP "+r.status+")"},502);
 const parsed=JSON.parse((await r.json()).choices?.[0]?.message?.content||"{}");
 if(!Array.isArray(parsed.items)||parsed.items.length!==16)return json({error:"Resposta da IA incompleta"},502);
 const items=parsed.items.map((a,i)=>{let choice=["yes","no","partial","na"].includes(a.choice)?a.choice:"";let page=Number.isInteger(a.page)?a.page:null;let evidence=String(a.evidence||"").slice(0,220).trim();if(!page||!evidence||!pageMap.get(page)?.replace(/\\s+/g," ").includes(evidence.replace(/\\s+/g," "))){choice="";page=null;evidence="";}if(choice==="partial"&&![2,4,7,8,9].includes(i+1))choice="";if(choice==="na"&&!(x.meta==="no"&&[11,12,15].includes(i+1)))choice="";return {item:i+1,choice,page,evidence,note:String(a.note||"").slice(0,600),confidence:choice?(a.confidence||"low"):"low"};});
 return json({items,verifiedEmail:user.email,reviewedBy:"IA — sugestão não validada"});
 }catch{return json({error:"Não foi possível concluir análise"},502)}
};
export const config={rateLimit:{action:"rate_limit",aggregateBy:"ip",windowSize:60,windowLimit:4}};
