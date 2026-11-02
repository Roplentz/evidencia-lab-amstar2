# Elaborador Universal de Projetos — integração v2

## Objetivo
Evoluir Evidência Lab com um fluxo de pergunta científica → escolha justificada de delineamento → planejamento do protocolo → auditoria → referências rastreáveis → exportação.

## Estado e segurança
O protótipo HTML autônomo foi produzido separadamente. Este documento registra a integração planejada sem sobrescrever a aplicação de produção. Não habilitar login fictício, não expor chaves de API no browser, não armazenar dados sensíveis de pacientes em localStorage.

## Módulos do protótipo
- Dez delineamentos: ECR, coorte, transversal, caso-controle, qualitativo, revisão sistemática, escopo, integrativa, acurácia diagnóstica, experimental.
- Orientação heurística de delineamento com ressalvas explícitas.
- Campos adaptativos de protocolo e auditoria de completude.
- Consulta ao NCBI E-utilities (esearch e esummary) por busca inserida pelo usuário, exibindo PMID/DOI.
- Atalhos DeCS e MeSH, sem alegar tradução automática nem integração DeCS.
- Importação e exportação JSON, texto e impressão em PDF.
- Versões armazenadas localmente no navegador.

## Requisitos de produção antes de lançar para alunos
1. Incorporar o módulo como rota `/projetos` no projeto existente, após identificar a arquitetura de páginas e deploy.
2. Criar autenticação de estudantes e docentes via provedor confiável, com RBAC e políticas por usuário.
3. Implementar banco de dados com tabelas para users, projects, project_versions, supervisor_feedback e references e trilha de auditoria.
4. Implementar proxy backend para NCBI com limites, erros, cache e logs sem informações pessoais.
5. Integrar exportação DOCX/PDF e testes de regressão; validar citações contra PMID/DOI.
6. Validar metodologia humana antes do uso em submissões a CEP/CONEP.
7. Fazer revisão de segurança, LGPD, privacidade e consentimento institucional.

## Referências metodológicas
EQUATOR Network; SPIRIT 2025/CONSORT 2025; PRISMA 2020 e PRISMA-P; PRISMA-ScR; STROBE; STARD; COREQ/SRQR; ARRIVE 2.0. Escolher guia conforme desenho; guia de relato não substitui método.

## Critérios de aceitação
Nenhuma referência fabricada; nenhum cálculo amostral arbitrário; não apresentar inferência causal como demonstrada; nenhum dado de paciente identificável; acesso docente apenas a projetos autorizados; exportações reprodutíveis.
