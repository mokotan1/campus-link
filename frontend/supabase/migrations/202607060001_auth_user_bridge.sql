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
