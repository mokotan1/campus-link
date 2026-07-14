-- Environment repair: restore Data API table privileges for roles used by
-- PostgREST / RLS tests. Local migrations create tables as postgres; after
-- Supabase 2026 defaults, those tables are no longer auto-exposed with
-- SELECT/INSERT/UPDATE/DELETE for anon/authenticated/service_role.
--
-- Keep this separate from feature migrations (see project-recruitment plan Task 1
-- Step 4). RLS remains the row-level authorization boundary.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;

grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables
  to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant usage, select on sequences
  to anon, authenticated, service_role;