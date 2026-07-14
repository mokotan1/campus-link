-- Remote / local post-deploy smoke contract (READ-ONLY).
--
-- Asserts RPCs, proposals table, RLS flags, project columns, and least-privilege
-- grants without inserting or updating any data. Safe for shared remote DBs.
--
-- Run (repo root, local Docker):
--   Get-Content frontend\supabase\tests\remote-rollout-smoke.sql -Raw |
--     docker exec -i supabase_db_frontend psql -U postgres -d postgres -v ON_ERROR_STOP=1
--
-- Or (linked / remote URL — do not use for write tests):
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/remote-rollout-smoke.sql

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- 1. Required RPCs resolve
-- ---------------------------------------------------------------------------

DO $rpcs$
DECLARE
  proc text;
  required_procs text[] := ARRAY[
    'public.current_app_user_id()',
    'public.owner_decide_application(bigint,text)',
    'public.applicant_withdraw_application(bigint)',
    'public.receiver_decide_proposal(bigint,text)',
    'public.sender_cancel_proposal(bigint)',
    'public.get_matching_eligibility(bigint)'
  ];
BEGIN
  FOREACH proc IN ARRAY required_procs LOOP
    IF to_regprocedure(proc) IS NULL THEN
      RAISE EXCEPTION '[FAIL] procedure missing: %', proc;
    END IF;
    RAISE NOTICE '[PASS] procedure resolves: %', proc;
  END LOOP;
END;
$rpcs$;

-- ---------------------------------------------------------------------------
-- 2. proposals table exists
-- ---------------------------------------------------------------------------

DO $proposals$
BEGIN
  IF to_regclass('public.proposals') IS NULL THEN
    RAISE EXCEPTION '[FAIL] public.proposals does not exist';
  END IF;
  RAISE NOTICE '[PASS] public.proposals exists';
END;
$proposals$;

-- ---------------------------------------------------------------------------
-- 3. RLS enabled on MVP tables
-- ---------------------------------------------------------------------------

DO $rls$
DECLARE
  tbl text;
  mvp_tables text[] := ARRAY[
    'users',
    'profiles',
    'portfolio_items',
    'projects',
    'applications',
    'proposals'
  ];
  rls_on boolean;
BEGIN
  FOREACH tbl IN ARRAY mvp_tables LOOP
    SELECT c.relrowsecurity
      INTO rls_on
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = tbl;

    IF rls_on IS NULL THEN
      RAISE EXCEPTION '[FAIL] public.% missing from pg_class', tbl;
    END IF;

    IF NOT rls_on THEN
      RAISE EXCEPTION '[FAIL] RLS disabled on public.%', tbl;
    END IF;

    RAISE NOTICE '[PASS] RLS enabled on public.%', tbl;
  END LOOP;
END;
$rls$;

-- ---------------------------------------------------------------------------
-- 4. projects has project_status and recruitment_deadline
-- ---------------------------------------------------------------------------

DO $columns$
DECLARE
  col text;
  required_cols text[] := ARRAY['project_status', 'recruitment_deadline'];
BEGIN
  FOREACH col IN ARRAY required_cols LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = col
    ) THEN
      RAISE EXCEPTION '[FAIL] projects.% column missing', col;
    END IF;
    RAISE NOTICE '[PASS] projects.% present', col;
  END LOOP;
END;
$columns$;

-- ---------------------------------------------------------------------------
-- 5. anon has no SELECT/INSERT/UPDATE/DELETE on MVP tables
-- 6. authenticated has SELECT on projects (at least)
-- ---------------------------------------------------------------------------

DO $grants$
DECLARE
  tbl text;
  priv text;
  mvp_tables text[] := ARRAY[
    'users',
    'profiles',
    'portfolio_items',
    'projects',
    'applications',
    'proposals'
  ];
  dml_privs text[] := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
BEGIN
  -- Per-privilege checks: compound has_table_privilege(..., 'SELECT,INSERT,...')
  -- is ALL-of and can pass falsely when anon still holds a subset.
  FOREACH tbl IN ARRAY mvp_tables LOOP
    FOREACH priv IN ARRAY dml_privs LOOP
      IF has_table_privilege('anon', 'public.' || tbl, priv) THEN
        RAISE EXCEPTION
          '[FAIL] anon must NOT have % on public.%', priv, tbl;
      END IF;
    END LOOP;
    RAISE NOTICE
      '[PASS] anon has no SELECT/INSERT/UPDATE/DELETE on public.%', tbl;
  END LOOP;

  IF NOT has_table_privilege('authenticated', 'public.projects', 'SELECT') THEN
    RAISE EXCEPTION '[FAIL] authenticated missing SELECT on public.projects';
  END IF;
  RAISE NOTICE '[PASS] authenticated has SELECT on public.projects';
END;
$grants$;
