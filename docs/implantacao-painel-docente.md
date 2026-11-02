# Evidência Lab — implantação do módulo aluno/docente

## Código adicionado
- `public/projetos.html`: cliente Supabase Auth + turmas + trabalhos + avaliações.
- `supabase/evidencia_lab_schema.sql`: tabelas PostgreSQL e políticas RLS.

## Como ativar
1. Escolher/criar **um projeto Supabase exclusivo** para o Evidência Lab (não reutilizar bancos de apps não relacionados).
2. Aplicar o SQL no editor SQL do Supabase. Fazer backup e revisar a migração antes de produção.
3. Configurar autenticação por e-mail/senha, confirmação de e-mail e domínios de redirecionamento apropriados.
4. Promover o docente via SQL administrativo, depois de ele criar uma conta:
   `update public.ev_profiles set role='teacher' where id='UUID_VALIDADO_DO_DOCENTE';`
5. Publicar a rota `/projetos.html` em um deploy de pré-visualização do Netlify, acessá-la e inserir URL do Supabase e chave `sb_publishable_` (nunca usar secret/service role).
6. Testar com pelo menos 1 docente e 2 alunos em dispositivos distintos. Verificar impedimento de acesso cruzado entre estudantes e turmas; confirmar que notas são imutáveis para estudantes.
7. Só então integrar navegação no site principal e liberar a turma.

## Limitações desta versão
- URL/chave publicável inseridas pelo visitante após abrir a página (configuração de produção ainda não automatizada).
- Matrícula exige que o aluno informe seu UUID ao professor (sem convite por e-mail).
- O parecer entra no histórico e na área do aluno, mas não atualiza o campo de status do projeto: a decisão do professor está no registro de feedback.
- Não existe chat em tempo real, notificações, upload de documentos ou exportação DOCX nesta rota.
- O elaborador universal anterior permanece separado. Nesta etapa há integração de identidade, projetos e pareceres; a migração automática de projetos locais para a nuvem não foi criada.
- Não usar para prontuários, dados de pacientes identificáveis ou protocolos confidenciais sem avaliação institucional LGPD.

## Testes de segurança obrigatórios
- Sem token: leitura/escrita negadas em todas as tabelas.
- Aluno A não lê nem altera projeto de aluno B.
- Aluno A não consegue se registrar como teacher.
- Aluno não consegue matricular outro aluno.
- Professor A não consegue avaliar turma do professor B.
- Troca de student_id e class_id via update deve ser bloqueada ou impossível por política/trigger.
- Um aluno com sessão expirada não deve conseguir salvar.
- Nenhuma chave secret ou service_role deve aparecer no HTML.

## Critério de aprovação
Nenhum release em produção antes de autenticação verificada, políticas testadas contra acessos indevidos e revisão de privacidade.
