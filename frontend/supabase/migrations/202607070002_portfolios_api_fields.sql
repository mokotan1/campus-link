alter table public.portfolio_items
  add column if not exists external_url varchar(500),
  add column if not exists role_in_work varchar(100),
  add column if not exists tools text[] not null default '{}',
  add column if not exists cover_image_name varchar(255);
