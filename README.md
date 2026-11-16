# Evidência Lab — AMSTAR 2

Ferramenta de ensino para avaliar a qualidade metodológica de revisões sistemáticas com o instrumento AMSTAR 2, usada na disciplina de Planejamento de Pesquisa da UFCSPA.

## O que faz

- Página única (`public/index.html`) com o formulário AMSTAR 2.
- Apoio de IA na avaliação, restrito a alunos autorizados (`netlify/functions/amstar-ai.mjs`).
- Envio da avaliação ao professor e painel docente com o histórico (`netlify/functions/amstar-records.mjs`, Netlify Blobs).
- Login com Google; a lista de alunos autorizados é lida de uma planilha privada.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `public/` | Site estático |
| `netlify/functions/` | Funções de backend |
| `netlify.toml` | Configuração de build e funções |
| `CONFIGURACAO.md` | Variáveis de ambiente e regras de acesso |
| `DEPLOY.md` | Passo a passo de publicação |

## Publicar

O deploy precisa ser por Git ou Netlify CLI, para incluir as funções. Veja `DEPLOY.md`.

## Configuração

Todas as credenciais ficam como variáveis de ambiente no Netlify (escopo Functions), nunca no HTML nem no repositório. A lista completa está em `CONFIGURACAO.md`. Sem credenciais, o servidor nega acesso à IA.

## Privacidade

Não armazene dados pessoais de pacientes nem PDFs de artigos restritos nos campos livres.
