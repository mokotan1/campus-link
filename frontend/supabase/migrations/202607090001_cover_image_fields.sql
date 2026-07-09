alter table public.projects
  add column if not exists cover_image_name varchar(255);

alter table public.portfolio_items
  add column if not exists cover_image_name varchar(255);
