-- Task 2: make the Auth-to-app-user relationship explicit.
--
-- This migration is additive and safe to re-run:
--   * the backfill only updates rows it can prove belong to exactly one
--     Supabase Auth subject by email; it never guesses a link;
--   * the foreign key and function are created conditionally so re-running
--     this migration against a database that already has them is a no-op;
--   * public.users.auth_user_id stays nullable, so legacy rows that cannot
--     be proven safe to link are left unlinked rather than failing the
--     migration or being linked incorrectly.
--
-- Result: `current_app_user_id()` is the single documented mapping from
-- `auth.uid()` to the existing bigint `public.users.id`.

-- 1. Backfill auth_user_id for legacy rows, but ONLY when the email
--    identifies exactly one auth.users row and exactly one public.users
--    row. Ambiguous or duplicate emails are left unlinked on purpose: a
--    wrong guess here would let one person read another person's data.
update public.users as u
set auth_user_id = matched.auth_id
from (
  select
    au.id as auth_id,
    lower(au.email) as email
  from auth.users as au
  where (select count(*) from auth.users au2 where lower(au2.email) = lower(au.email)) = 1
) as matched
where u.auth_user_id is null
  and lower(u.email) = matched.email
  and (select count(*) from public.users u2 where lower(u2.email) = matched.email) = 1;

-- 2. Enforce the relationship to auth.users with a foreign key. The column
--    stays nullable (unmatched legacy rows keep auth_user_id = null);
--    application code must treat a null auth_user_id as "not
--    authenticated", never as an assumption of implicit ownership.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_user_id_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_auth_user_id_fkey
      foreign key (auth_user_id)
      references auth.users (id)
      on delete cascade;
  end if;
end;
$$;

-- 3. current_app_user_id(): the single, documented mapping from the
--    Supabase Auth subject (auth.uid()) to the existing bigint
--    public.users.id. security definer + a fixed search_path let it read
--    public.users under RLS (added in a later migration) without granting
--    broad table access to authenticated clients; stable so the planner may
--    cache it within a single statement.
create or replace function public.current_app_user_id()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id
  from public.users
  where auth_user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_app_user_id() from public;
grant execute on function public.current_app_user_id() to authenticated, service_role;
