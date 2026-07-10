-- auth_user_id is the bridge column linking public.users to Supabase Auth.
-- The foreign key to auth.users(id) and the current_app_user_id() helper
-- are added in 202607100001_auth_identity_and_mvp_constraints.sql instead of
-- here, so that this migration remains a no-op re-run against databases
-- where it already applied without the FK/helper.
alter table public.users
  add column if not exists auth_user_id uuid unique;

alter table public.users
  alter column password_hash drop not null,
  alter column name drop not null;

alter table public.users
  alter column role set default 'STUDENT',
  alter column auth_provider set default 'SUPABASE';

update public.users
set auth_provider = 'SUPABASE'
where auth_provider is null;
