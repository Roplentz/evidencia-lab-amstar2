# Evidência Lab 6 — autorização dinâmica pela planilha da disciplina

## Fonte
Planilha privada **Contatos da disciplina de Planejamento de Pesquisa da UFCSPA**: ID `1CRd_X4-HGeWUZCUI-5dQkmjCuUt-Bt3ts61k80CfbZA`; aba `Página1`, coluna `B` (email), a partir da linha 2. Os 32 endereços não estão incluídos no código público.

## Configuração necessária no Netlify (somente escopo Functions, segredo)
1. `OPENAI_API_KEY` — emitida na sua conta OpenAI Platform (uso tarifado).
2. `GOOGLE_CLIENT_ID` — OAuth Client ID Web com origem `https://astonishing-dolphin-12f216.netlify.app`.
3. `AMSTAR_SHEET_ID` — `1CRd_X4-HGeWUZCUI-5dQkmjCuUt-Bt3ts61k80CfbZA`.
4. `GOOGLE_SERVICE_ACCOUNT_EMAIL` — e-mail de uma conta de serviço do Google Cloud.
5. `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — chave privada PEM da conta de serviço, secret; nunca pôr no HTML.

Compartilhe a planilha **somente como leitor** com `GOOGLE_SERVICE_ACCOUNT_EMAIL` no Google Drive. Habilite Google Sheets API no projeto Google Cloud da conta de serviço. A lista é lida a cada 60 segundos no máximo por instância da função. Novo e-mail incluído na coluna B pode passar a entrar; removido perde o acesso nas consultas seguintes (até ~60 s de cache).

**Sem credenciais, o servidor nega todo acesso à IA**. Nenhuma lista pública, autorização de domínio inteiro ou fallback inseguro.

## Como publicar
É necessário deploy por Git ou Netlify CLI para incluir `netlify/functions/amstar-ai.mjs`; o Netlify Drop sozinho pode publicar a página mas não empacota esse backend. Redeploy após atualizar segredos. Teste com um e-mail autorizado e outro não autorizado; confira os logs da função.

## Estado atual
Código e verificação de sintaxe preparados. Integração de ponta a ponta requer credenciais OAuth, serviço Google e API OpenAI, além de deploy. Avaliações humanas ainda persistem localmente e não existem registros centralizados no servidor. Para painel de histórico multiusuário será necessário backend/banco com políticas de acesso separadas.


## Evidência Lab 7 — histórico e painel docente
- Função `amstar-records.mjs` armazena avaliações (sem PDFs) no Netlify Blobs, com cada registro vinculado ao e-mail verificado via Google.
- `AMSTAR_TEACHER_EMAILS`: lista de e-mails docentes separados por vírgula; configurar como segredo em Netlify Functions. **Não colocar no HTML**.
- `package.json` inclui `@netlify/blobs`. Deploy por Git/Netlify CLI (não Netlify Drop simples).
- Botão **Enviar minha avaliação ao professor** exige login, envia registros e retorna ID. **Abrir painel docente** retorna todos os registros somente para professor incluído em `AMSTAR_TEACHER_EMAILS`; demais alunos recebem apenas os próprios registros.
- A lista de alunos é lida pela conta de serviço com acesso à planilha; sem credenciais, o sistema nega acesso.
- Armazenamento de objetos não é banco transacional. Para turmas maiores, relatórios avançados e edição concorrente, migrar a Postgres com RLS.
- Limite de exibição: 500 registros recentes (limitação desta versão).
- Não armazenar dados pessoais de pacientes ou PDFs de artigos restritos nos campos livres.
- Ainda depende de configurar credenciais do Google, OpenAI e realizar deploy do backend.