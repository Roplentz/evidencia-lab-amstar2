import {getStore} from '@netlify/blobs';
import {authenticateGoogle} from './amstar-ai.mjs';
import {createHash,randomUUID} from 'node:crypto';
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const hash=s=>createHash("sha256").update(s).digest("hex");
const valid=new Set(["yes","partial","no","na",""]);
function clean(x,email){
 if(!x||!Array.isArray(x.answers)||x.answers.length!==16)throw Error("16 itens obrigatórios");
 if(!["yes","no"].includes(x.meta))throw Error("Metanálise inválida");
 const answers=x.answers.map(a=>{let choice=String(a?.choice||"");if(!valid.has(choice))throw Error("Resposta inválida");return {choice,location:String(a?.location||"").slice(0,250),evidence:String(a?.evidence||"").slice(0,950),note:String(a?.note||"").slice(0,1500)}});
 const title=String(x.title||"").slice(0,450);if(!title.trim())throw Error("Informe o artigo");
 return {id:randomUUID(),email,student:String(x.student||"").slice(0,160),team:String(x.team||"").slice(0,100),title,doi:String(x.doi||"").slice(0,220),meta:x.meta,answers,ai:Array.isArray(x.ai)?x.ai.slice(0,16).map(a=>({choice:String(a.choice||"").slice(0,16),page:String(a.page||"").slice(0,60),note:String(a.note||"").slice(0,1000)})):[],conclusion:String(x.conclusion||"").slice(0,2500),createdAt:new Date().toISOString()};
}
function stats(records){const students=new Set(records.map(x=>x.email)),papers=new Set(records.map(x=>x.doi||x.title.toLowerCase()));let withAi=0,disagreements=0,compared=0;for(const r of records){let seen=false;for(let i=0;i<16;i++){const a=r.answers[i]?.choice,b=r.ai[i]?.choice;if(a&&valid.has(b)&&b){seen=true;compared++;if(a!==b)disagreements++;}}if(seen)withAi++;}return {submissions:records.length,students:students.size,papers:papers.size,complete:records.filter(r=>r.answers.every((a,i)=>!!a.choice||(r.meta==="no"&&[10,11,14].includes(i)))).length,withAi,disagreements,compared,criticalItems:[2,4,7,9,11,13,15]};}
export default async req=>{
 if(!["GET","POST"].includes(req.method))return json({error:"Método inválido"},405);
 const user=await authenticateGoogle(req);if(user.error)return json({error:user.error},user.status);
 const store=getStore("evidencia-lab-submissions-v1");
 if(req.method==="POST"){
  const raw=await req.text();if(raw.length>60000)return json({error:"Registro muito grande"},413);
  let record;try{record=clean(JSON.parse(raw),user.email)}catch(e){return json({error:e.message},422)}
  try{await store.setJSON("records/"+hash(user.email)+"/"+record.id+".json",record,{onlyIfNew:true});return json({ok:true,id:record.id,createdAt:record.createdAt},201)}catch{return json({error:"Falha ao salvar"},503)}
 }
 const url=new URL(req.url);
 if(url.searchParams.get("mode")==="status")return json({ok:true,email:user.email,teacher:user.teacher});
 const all=user.teacher&&url.searchParams.get("mode")==="teacher";
 const prefix=all?"records/":"records/"+hash(user.email)+"/";
 try{const list=await store.list({prefix});const records=(await Promise.all(list.blobs.slice(0,500).map(b=>store.get(b.key,{type:"json"})))).filter(Boolean).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));return json(all?{teacher:true,summary:stats(records),records}:{teacher:user.teacher,records});}catch{return json({error:"Falha ao carregar histórico"},503)}
};
export const config={rateLimit:{action:"rate_limit",aggregateBy:"ip",windowSize:60,windowLimit:30}};
