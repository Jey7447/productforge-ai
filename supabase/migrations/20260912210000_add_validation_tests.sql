create table if not exists public.validation_tests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  validation_report_id uuid not null references public.validation_reports(id) on delete cascade,
  test_type text not null,
  hypothesis text not null,
  test_plan text not null,
  success_criteria text not null,
  status text not null default 'planned',
  notes text,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint validation_tests_status_check check (status in ('planned','in_progress','passed','failed'))
);

create index if not exists validation_tests_project_id_idx on public.validation_tests(project_id);
create index if not exists validation_tests_opportunity_id_idx on public.validation_tests(opportunity_id);
create index if not exists validation_tests_report_id_idx on public.validation_tests(validation_report_id);

alter table public.validation_tests enable row level security;

create policy "Users can view validation tests for their projects"
on public.validation_tests for select
using (exists (select 1 from public.projects p where p.id = validation_tests.project_id and p.user_id = auth.uid()));

create policy "Users can create validation tests for their projects"
on public.validation_tests for insert
with check (exists (select 1 from public.projects p where p.id = validation_tests.project_id and p.user_id = auth.uid()));

create policy "Users can update validation tests for their projects"
on public.validation_tests for update
using (exists (select 1 from public.projects p where p.id = validation_tests.project_id and p.user_id = auth.uid()))
with check (exists (select 1 from public.projects p where p.id = validation_tests.project_id and p.user_id = auth.uid()));

create trigger validation_tests_updated_at
before update on public.validation_tests
for each row execute function public.set_updated_at();
