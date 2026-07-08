alter table public.users
  add column if not exists email_verified boolean not null default false;
