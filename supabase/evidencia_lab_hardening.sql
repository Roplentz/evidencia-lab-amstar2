-- Defense in depth: aluno não pode mover projetos para outra turma nem alterar autoria.
create or replace function public.ev_protect_project_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
 if new.student_id is distinct from old.student_id
    or new.class_id is distinct from old.class_id then
   raise exception 'Autoria e turma do projeto são imutáveis';
 end if;
 return new;
end $$;
revoke all on function public.ev_protect_project_identity() from public,anon,authenticated;
drop trigger if exists ev_project_identity_guard on public.ev_projects;
create trigger ev_project_identity_guard before update on public.ev_projects
for each row execute function public.ev_protect_project_identity();
