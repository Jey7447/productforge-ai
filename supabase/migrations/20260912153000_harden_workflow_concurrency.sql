create unique index if not exists research_runs_one_active_per_project
  on public.research_runs (project_id)
  where status = 'running';

create unique index if not exists opportunity_searches_one_active_per_project
  on public.opportunity_searches (project_id)
  where status = 'running';
