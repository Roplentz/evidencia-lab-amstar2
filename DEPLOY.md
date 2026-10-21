# Evidência Lab 7.1 — Publicação segura

## Antes de publicar
- Defina OPENAI_API_KEY (segredo, somente Functions).
- Defina GOOGLE_CLIENT_ID (ID do OAuth Web com origem HTTPS do Netlify).
- Defina AMSTAR_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (PEM em Functions). Compartilhe a planilha como leitor com a conta de serviço.
- Defina AMSTAR_TEACHER_EMAILS com os endereços dos docentes autorizados.
- A credencial OAuth e a chave da conta de serviço não podem ficar em arquivos públicos.

## Publicação
Conecte o repositório Git ao site Netlify existente, com base na raiz e `netlify.toml` existente, ou use o CLI autenticado (`netlify deploy --prod --build --site <SITE_ID>`).
Não use Netlify Drop para esta versão: é necessária a implantação das Functions e dependências.

## Segurança
A pasta publicada é somente `public/`; código do servidor e configurações não estarão no diretório público. Auth precisa de ID token verificado e e-mail presente na planilha ou lista docente. Ative limites de custos OpenAI. Teste usuários autorizados e negados, logout, upload e PDF.

## Estado
Implementação preparada, não publicada pela integração atual. O painel não está ativo sem credenciais e um deploy com Functions.