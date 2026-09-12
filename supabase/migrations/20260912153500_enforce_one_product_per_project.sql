create unique index if not exists products_one_per_project
  on public.products (project_id);
