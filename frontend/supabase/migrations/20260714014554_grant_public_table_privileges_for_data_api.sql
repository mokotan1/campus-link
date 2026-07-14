-- Environment repair: Data API privileges for PostgREST + RLS.
-- Separate from feature migrations (plan Task 1 Step 4).
-- Do NOT grant DML to anon — MVP policies target authenticated only.
-- Do NOT use ON ALL TABLES or ALTER DEFAULT PRIVILEGES for anon
-- (avoids undoing Supabase 2026 opt-in Data API defaults).

grant usage on schema public to authenticated, service_role;

-- Explicitly revoke anon DML (least privilege). Do not grant TRUNCATE /
-- REFERENCES / TRIGGER to application roles.
revoke select, insert, update, delete on
  public.users,
  public.profiles,
  public.portfolio_items,
  public.projects,
  public.applications,
  public.proposals
  from anon;

revoke usage, select on all sequences in schema public from anon;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon;

grant select, insert, update, delete on
  public.users,
  public.profiles,
  public.portfolio_items,
  public.projects,
  public.applications,
  public.proposals
  to authenticated, service_role;

grant usage, select on all sequences in schema public
  to authenticated, service_role;

-- Future tables created by postgres: authenticated/service_role only
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables
  to authenticated, service_role;

alter default privileges for role postgres in schema public
  grant usage, select on sequences
  to authenticated, service_role;
