alter table public.projects
  add column if not exists campus varchar(100),
  add column if not exists required_roles text[] not null default '{}',
  add column if not exists tools text[] not null default '{}',
  add column if not exists cover_image_name varchar(255);
