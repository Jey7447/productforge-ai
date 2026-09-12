alter policy "Users can delete own launch plans" on public.launch_plans to authenticated;
alter policy "Users can insert own launch plans" on public.launch_plans to authenticated;
alter policy "Users can update own launch plans" on public.launch_plans to authenticated;
alter policy "Users can view own launch plans" on public.launch_plans to authenticated;

alter policy "Users can create validation tests for their projects" on public.validation_tests to authenticated;
alter policy "Users can update validation tests for their projects" on public.validation_tests to authenticated;
alter policy "Users can view validation tests for their projects" on public.validation_tests to authenticated;
