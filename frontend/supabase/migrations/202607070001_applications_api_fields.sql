alter table public.applications
  add column if not exists target_role varchar(100);
