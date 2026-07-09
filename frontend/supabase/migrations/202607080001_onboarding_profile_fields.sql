alter table public.users
  add column if not exists campus varchar(100);

alter table public.profiles
  add column if not exists display_name varchar(80),
  add column if not exists role_tags text[] not null default '{}',
  add column if not exists availability_status varchar(40),
  add column if not exists collaboration_type varchar(80),
  add column if not exists weekly_hours varchar(40),
  add column if not exists onboarding_completed boolean not null default false;
