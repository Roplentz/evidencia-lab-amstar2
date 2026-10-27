-- Evidência Lab: auth + acompanhamento docente. Aplicar em Supabase exclusivo.
create extension if not exists pgcrypto;
create table if not exists public.ev_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '',
 role text not null default 'student' check (role in ('student','teacher')),
 created_at timestamptz not null default now()
);
create table if not exists public.ev_classes (
 id uuid primary key default gen_random_uuid(),
 teacher_id uuid not null references auth.users(id),
 name text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.ev_enrollments (
 class_id uuid not null references public.ev_classes(id) on delete cascade,
 student_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 primary key (class_id,student_id)
);
create table if not exists public.ev_projects (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.ev_classes(id),
 student_id uuid not null references auth.users(id),
 title text not null default 'Projeto sem título',
 question text not null default '',
 design text not null default '',
 protocol jsonb not null default '{}'::jsonb,
 status text not null default 'draft' check(status in ('draft','submitted','revision','approved')),
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create table if not exists public.ev_feedback (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.ev_projects(id) on delete cascade,
 teacher_id uuid not null references auth.users(id),
 score numeric(4,2) check(score between 0 and 10),
 comment text not null,
 decision text not null check(decision in ('revision','approved')),
 created_at timestamptz not null default now()
);
create index if not exists ev_projects_student_idx on public.ev_projects(student_id);
create index if not exists ev_projects_class_idx on public.ev_projects(class_id);
create index if not exists ev_enrollments_student_idx on public.ev_enrollments(student_id);
create index if not exists ev_feedback_project_idx on public.ev_feedback(project_id);
alter table public.ev_profiles enable row level security;
alter table public.ev_classes enable row level security;
alter table public.ev_enrollments enable row level security;
alter table public.ev_projects enable row level security;
alter table public.ev_feedback enable row level security;
revoke all on public.ev_profiles,public.ev_classes,public.ev_enrollments,public.ev_projects,public.ev_feedback from anon;
grant select,insert,update on public.ev_profiles to authenticated;
grant select,insert on public.ev_classes to authenticated;
grant select,insert,delete on public.ev_enrollments to authenticated;
grant select,insert,update on public.ev_projects to authenticated;
grant select,insert on public.ev_feedback to authenticated;
-- Role cannot be selected via user_metadata. Teachers promoted via trusted admin SQL only.
create policy "profile own read" on public.ev_profiles for select to authenticated using (id=(select auth.uid()));
create policy "profile own student create" on public.ev_profiles for insert to authenticated with check (id=(select auth.uid()) and role='student');
-- Deliberately no client update to role/profile to prevent privilege changes.
revoke update on public.ev_profiles from authenticated;
create policy "teacher own classes" on public.ev_classes for select to authenticated using (teacher_id=(select auth.uid()));
create policy "teacher creates classes" on public.ev_classes for insert to authenticated with check (
 teacher_id=(select auth.uid()) and exists(select 1 from public.ev_profiles p where p.id=(select auth.uid()) and p.role='teacher')
);
create policy "teacher sees enrollments" on public.ev_enrollments for select to authenticated using (
 student_id=(select auth.uid()) or exists(select 1 from public.ev_classes c where c.id=class_id and c.teacher_id=(select auth.uid()))
);
create policy "teacher enrolls students" on public.ev_enrollments for insert to authenticated with check (
 exists(select 1 from public.ev_classes c where c.id=class_id and c.teacher_id=(select auth.uid()))
 and exists(select 1 from public.ev_profiles p where p.id=student_id and p.role='student')
);
create policy "teacher removes students" on public.ev_enrollments for delete to authenticated using (
 exists(select 1 from public.ev_classes c where c.id=class_id and c.teacher_id=(select auth.uid()))
);
create policy "student teacher read projects" on public.ev_projects for select to authenticated using (
 student_id=(select auth.uid()) or exists(select 1 from public.ev_classes c where c.id=class_id and c.teacher_id=(select auth.uid()))
);
create policy "student creates own project" on public.ev_projects for insert to authenticated with check (
 student_id=(select auth.uid()) and status='draft'
 and exists(select 1 from public.ev_enrollments e where e.class_id=ev_projects.class_id and e.student_id=(select auth.uid()))
);
-- One state transition managed by student: submitted or drafts, but never self-approve.
create policy "student updates own project" on public.ev_projects for update to authenticated
 using(student_id=(select auth.uid()) and status in ('draft','revision','submitted'))
 with check(student_id=(select auth.uid()) and status in ('draft','submitted','revision'));
create policy "read project feedback" on public.ev_feedback for select to authenticated using (
 exists(select 1 from public.ev_projects p where p.id=project_id and
 (p.student_id=(select auth.uid()) or exists(select 1 from public.ev_classes c where c.id=p.class_id and c.teacher_id=(select auth.uid()))))
);
create policy "teacher submits feedback" on public.ev_feedback for insert to authenticated with check (
 teacher_id=(select auth.uid()) and exists(select 1 from public.ev_projects p
 join public.ev_classes c on c.id=p.class_id where p.id=project_id and c.teacher_id=(select auth.uid()))
);
-- feedback rows are authoritative; project status is student-editable for draft workflow, not grading.
-- Promotion example (manually in SQL editor, with exact account UUID):
-- update public.ev_profiles set role='teacher' where id='UUID_DO_DOCENTE';
