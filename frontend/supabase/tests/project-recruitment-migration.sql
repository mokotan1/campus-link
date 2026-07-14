-- Project recruitment status / deadline migration contract test.
--
-- Fails against the pre-migration schema on the first missing column/constraint.
-- After migration  *_project_recruitment_status_and_deadline.sql, the full
-- transaction (schema, integrity, backfill, indexes, deadline-aware RLS) passes.
--
-- Run (repo root, local Docker):
--   Get-Content frontend\supabase\tests\project-recruitment-migration.sql -Raw |
--     docker exec -i supabase_db_frontend psql -U postgres -d postgres -v ON_ERROR_STOP=1
--
-- Or:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/project-recruitment-migration.sql

\set ON_ERROR_STOP on

BEGIN;

-- ---------------------------------------------------------------------------
-- Step 1: Schema contract (columns + named constraints)
-- ---------------------------------------------------------------------------

DO $schema$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'project_status'
      AND data_type = 'character varying'
      AND is_nullable = 'NO'
      AND column_default LIKE '%PREPARING%'
  ) THEN
    RAISE EXCEPTION
      '[FAIL] projects.project_status varchar not null default ''PREPARING'' missing';
  END IF;

  RAISE NOTICE '[PASS] projects.project_status varchar not null default PREPARING';

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'recruitment_deadline'
      AND data_type = 'date'
  ) THEN
    RAISE EXCEPTION '[FAIL] projects.recruitment_deadline date missing';
  END IF;

  RAISE NOTICE '[PASS] projects.recruitment_deadline date';

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_project_status_check'
  ) THEN
    RAISE EXCEPTION '[FAIL] projects_project_status_check missing';
  END IF;

  RAISE NOTICE '[PASS] projects_project_status_check';

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_expected_member_count_positive_check'
  ) THEN
    RAISE EXCEPTION '[FAIL] projects_expected_member_count_positive_check missing';
  END IF;

  RAISE NOTICE '[PASS] projects_expected_member_count_positive_check';
END;
$schema$;

-- ---------------------------------------------------------------------------
-- Auth / app-user fixtures (distinct from rls-p0.sql subjects)
-- ---------------------------------------------------------------------------

DO $fixtures$
DECLARE
  owner_auth_id uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  applicant_auth_id uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  receiver_auth_id uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  owner_user_id bigint;
  applicant_user_id bigint;
  receiver_user_id bigint;

  future_project_id bigint;
  expired_project_id bigint;
  legacy_null_project_id bigint;
  backfill_project_id bigint;
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  )
  VALUES
    (
      owner_auth_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'rec-owner@test.local',
      crypt('password', gen_salt('bf')),
      now(),
      now(),
      now()
    ),
    (
      applicant_auth_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'rec-applicant@test.local',
      crypt('password', gen_salt('bf')),
      now(),
      now(),
      now()
    ),
    (
      receiver_auth_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'rec-receiver@test.local',
      crypt('password', gen_salt('bf')),
      now(),
      now(),
      now()
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (email, password_hash, name, role, auth_provider, auth_user_id)
  VALUES
    ('rec-owner@test.local', '', 'Rec Owner', 'STUDENT', 'SUPABASE', owner_auth_id),
    ('rec-applicant@test.local', '', 'Rec Applicant', 'STUDENT', 'SUPABASE', applicant_auth_id),
    ('rec-receiver@test.local', '', 'Rec Receiver', 'STUDENT', 'SUPABASE', receiver_auth_id)
  ON CONFLICT (email) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id;

  SELECT id INTO owner_user_id FROM public.users WHERE auth_user_id = owner_auth_id;
  SELECT id INTO applicant_user_id FROM public.users WHERE auth_user_id = applicant_auth_id;
  SELECT id INTO receiver_user_id FROM public.users WHERE auth_user_id = receiver_auth_id;

  -- Backfill integrity fixture: end_date and recruitment_deadline must match.
  INSERT INTO public.projects (
    owner_user_id,
    title,
    summary,
    project_type,
    collaboration_mode,
    recruitment_status,
    required_roles,
    end_date,
    recruitment_deadline,
    project_status
  )
  VALUES (
    owner_user_id,
    'Rec Backfill Fixture',
    'end_date copied into recruitment_deadline',
    'TEAM',
    'ONLINE',
    'CLOSED',
    ARRAY['Developer'],
    DATE '2030-06-01',
    DATE '2030-06-01',
    'PREPARING'
  )
  RETURNING id INTO backfill_project_id;

  INSERT INTO public.projects (
    owner_user_id,
    title,
    summary,
    project_type,
    collaboration_mode,
    recruitment_status,
    required_roles,
    recruitment_deadline,
    project_status
  )
  VALUES (
    owner_user_id,
    'Rec Future Recruiting',
    'visible while deadline is in the future',
    'TEAM',
    'ONLINE',
    'RECRUITING',
    ARRAY['Developer'],
    (current_date + 14),
    'PREPARING'
  )
  RETURNING id INTO future_project_id;

  INSERT INTO public.projects (
    owner_user_id,
    title,
    summary,
    project_type,
    collaboration_mode,
    recruitment_status,
    required_roles,
    recruitment_deadline,
    project_status
  )
  VALUES (
    owner_user_id,
    'Rec Expired Recruiting',
    'hidden from non-owners after deadline',
    'TEAM',
    'ONLINE',
    'RECRUITING',
    ARRAY['Designer'],
    (current_date - 1),
    'PREPARING'
  )
  RETURNING id INTO expired_project_id;

  INSERT INTO public.projects (
    owner_user_id,
    title,
    summary,
    project_type,
    collaboration_mode,
    recruitment_status,
    required_roles,
    recruitment_deadline,
    project_status
  )
  VALUES (
    owner_user_id,
    'Rec Legacy Null Deadline',
    'null deadline remains temporarily eligible',
    'TEAM',
    'ONLINE',
    'RECRUITING',
    ARRAY['PM'],
    NULL,
    'PREPARING'
  )
  RETURNING id INTO legacy_null_project_id;

  PERFORM set_config('rec.owner_auth_id', owner_auth_id::text, true);
  PERFORM set_config('rec.applicant_auth_id', applicant_auth_id::text, true);
  PERFORM set_config('rec.receiver_auth_id', receiver_auth_id::text, true);
  PERFORM set_config('rec.owner_user_id', owner_user_id::text, true);
  PERFORM set_config('rec.applicant_user_id', applicant_user_id::text, true);
  PERFORM set_config('rec.receiver_user_id', receiver_user_id::text, true);
  PERFORM set_config('rec.future_project_id', future_project_id::text, true);
  PERFORM set_config('rec.expired_project_id', expired_project_id::text, true);
  PERFORM set_config('rec.legacy_null_project_id', legacy_null_project_id::text, true);
  PERFORM set_config('rec.backfill_project_id', backfill_project_id::text, true);
END;
$fixtures$;

-- ---------------------------------------------------------------------------
-- JWT impersonation helpers (same pattern as rls-p0.sql)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pg_temp.rls_set_auth(p_sub uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', p_sub::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.rls_reset_role()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  RESET role;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.rls_assert_count(p_sql text, p_expected integer, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  actual integer;
BEGIN
  EXECUTE format('SELECT count(*) FROM (%s) q', p_sql) INTO actual;

  IF actual IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION '[FAIL] %: expected % rows, got %', p_label, p_expected, actual;
  END IF;

  RAISE NOTICE '[PASS] %', p_label;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.rls_assert_insert_blocked(p_sql text, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
    RAISE EXCEPTION '[FAIL] %: insert succeeded unexpectedly', p_label;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE '[PASS] %', p_label;
    WHEN OTHERS THEN
      IF SQLERRM ~* '(policy|permission|row-level security|violates)' THEN
        RAISE NOTICE '[PASS] %', p_label;
      ELSE
        RAISE;
      END IF;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.rls_assert_insert_ok(p_sql text, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE p_sql;
  RAISE NOTICE '[PASS] %', p_label;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '[FAIL] %: insert failed: %', p_label, SQLERRM;
END;
$$;

-- ---------------------------------------------------------------------------
-- Step 2: Data-integrity assertions (status + expected_member_count checks)
-- ---------------------------------------------------------------------------

DO $integrity$
DECLARE
  owner_user_id bigint := current_setting('rec.owner_user_id')::bigint;
BEGIN
  INSERT INTO public.projects (
    owner_user_id,
    title,
    summary,
    project_type,
    collaboration_mode,
    recruitment_status,
    required_roles,
    project_status
  )
  VALUES (
    owner_user_id,
    'Rec Status PREPARING',
    'valid status',
    'TEAM',
    'ONLINE',
    'CLOSED',
    ARRAY['Developer'],
    'PREPARING'
  );
  RAISE NOTICE '[PASS] insert project with project_status = PREPARING';

  INSERT INTO public.projects (
    owner_user_id,
    title,
    summary,
    project_type,
    collaboration_mode,
    recruitment_status,
    required_roles,
    project_status
  )
  VALUES (
    owner_user_id,
    'Rec Status IN_PROGRESS',
    'valid status',
    'TEAM',
    'ONLINE',
    'CLOSED',
    ARRAY['Developer'],
    'IN_PROGRESS'
  );
  RAISE NOTICE '[PASS] insert project with project_status = IN_PROGRESS';

  INSERT INTO public.projects (
    owner_user_id,
    title,
    summary,
    project_type,
    collaboration_mode,
    recruitment_status,
    required_roles,
    project_status
  )
  VALUES (
    owner_user_id,
    'Rec Status COMPLETED',
    'valid status',
    'TEAM',
    'ONLINE',
    'CLOSED',
    ARRAY['Developer'],
    'COMPLETED'
  );
  RAISE NOTICE '[PASS] insert project with project_status = COMPLETED';

  BEGIN
    INSERT INTO public.projects (
      owner_user_id,
      title,
      summary,
      project_type,
      collaboration_mode,
      recruitment_status,
      required_roles,
      project_status
    )
    VALUES (
      owner_user_id,
      'Rec Status PAUSED',
      'invalid status',
      'TEAM',
      'ONLINE',
      'CLOSED',
      ARRAY['Developer'],
      'PAUSED'
    );
    RAISE EXCEPTION '[FAIL] insert with project_status = PAUSED should raise check_violation';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '[PASS] insert with project_status = PAUSED raises check_violation';
  END;

  BEGIN
    INSERT INTO public.projects (
      owner_user_id,
      title,
      summary,
      project_type,
      collaboration_mode,
      recruitment_status,
      required_roles,
      expected_member_count,
      project_status
    )
    VALUES (
      owner_user_id,
      'Rec Member Count Zero',
      'invalid count',
      'TEAM',
      'ONLINE',
      'CLOSED',
      ARRAY['Developer'],
      0,
      'PREPARING'
    );
    RAISE EXCEPTION '[FAIL] insert with expected_member_count = 0 should raise check_violation';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '[PASS] insert with expected_member_count = 0 raises check_violation';
  END;

  BEGIN
    INSERT INTO public.projects (
      owner_user_id,
      title,
      summary,
      project_type,
      collaboration_mode,
      recruitment_status,
      required_roles,
      expected_member_count,
      project_status
    )
    VALUES (
      owner_user_id,
      'Rec Member Count Negative',
      'invalid count',
      'TEAM',
      'ONLINE',
      'CLOSED',
      ARRAY['Developer'],
      -1,
      'PREPARING'
    );
    RAISE EXCEPTION '[FAIL] insert with expected_member_count = -1 should raise check_violation';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '[PASS] insert with expected_member_count = -1 raises check_violation';
  END;
END;
$integrity$;

-- ---------------------------------------------------------------------------
-- Step 3: Backfill consistency + index assertions
-- ---------------------------------------------------------------------------

DO $backfill_indexes$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.projects
    WHERE end_date IS NOT NULL
      AND recruitment_deadline IS DISTINCT FROM end_date
  ) THEN
    RAISE EXCEPTION
      '[FAIL] backfill: non-null end_date rows must match recruitment_deadline';
  END IF;

  RAISE NOTICE
    '[PASS] every non-null end_date has matching recruitment_deadline';

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'projects_owner_recruitment_deadline_idx'
  ) THEN
    RAISE EXCEPTION '[FAIL] projects_owner_recruitment_deadline_idx missing';
  END IF;

  RAISE NOTICE '[PASS] projects_owner_recruitment_deadline_idx';

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'projects_recruitment_deadline_idx'
  ) THEN
    RAISE EXCEPTION '[FAIL] projects_recruitment_deadline_idx missing';
  END IF;

  RAISE NOTICE '[PASS] projects_recruitment_deadline_idx';

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'applications_project_created_at_idx'
  ) THEN
    RAISE EXCEPTION '[FAIL] applications_project_created_at_idx missing';
  END IF;

  RAISE NOTICE '[PASS] applications_project_created_at_idx';
END;
$backfill_indexes$;

-- ---------------------------------------------------------------------------
-- Step 4: Deadline-aware RLS assertions
-- ---------------------------------------------------------------------------

DO $rls$
DECLARE
  owner_auth_id uuid := current_setting('rec.owner_auth_id')::uuid;
  applicant_auth_id uuid := current_setting('rec.applicant_auth_id')::uuid;
  owner_user_id bigint := current_setting('rec.owner_user_id')::bigint;
  applicant_user_id bigint := current_setting('rec.applicant_user_id')::bigint;
  receiver_user_id bigint := current_setting('rec.receiver_user_id')::bigint;
  future_project_id bigint := current_setting('rec.future_project_id')::bigint;
  expired_project_id bigint := current_setting('rec.expired_project_id')::bigint;
  legacy_null_project_id bigint := current_setting('rec.legacy_null_project_id')::bigint;
BEGIN
  -- non-owner can read future recruiting project
  PERFORM pg_temp.rls_set_auth(applicant_auth_id);
  PERFORM pg_temp.rls_assert_count(
    format('SELECT 1 FROM public.projects WHERE id = %s', future_project_id),
    1,
    'non-owner can read future recruiting project'
  );

  -- non-owner cannot read expired recruiting project
  PERFORM pg_temp.rls_assert_count(
    format('SELECT 1 FROM public.projects WHERE id = %s', expired_project_id),
    0,
    'non-owner cannot read expired recruiting project'
  );

  -- owner can read own expired recruiting project
  PERFORM pg_temp.rls_set_auth(owner_auth_id);
  PERFORM pg_temp.rls_assert_count(
    format('SELECT 1 FROM public.projects WHERE id = %s', expired_project_id),
    1,
    'owner can read own expired recruiting project'
  );

  -- applicant can apply to future recruiting project
  PERFORM pg_temp.rls_set_auth(applicant_auth_id);
  PERFORM pg_temp.rls_assert_insert_ok(
    format(
      $sql$
      INSERT INTO public.applications (
        project_id, applicant_user_id, application_status, target_role
      ) VALUES (%s, %s, 'PENDING', 'Developer')
      $sql$,
      future_project_id,
      applicant_user_id
    ),
    'applicant can apply to future recruiting project'
  );

  -- applicant cannot apply to expired recruiting project
  PERFORM pg_temp.rls_assert_insert_blocked(
    format(
      $sql$
      INSERT INTO public.applications (
        project_id, applicant_user_id, application_status, target_role
      ) VALUES (%s, %s, 'PENDING', 'Designer')
      $sql$,
      expired_project_id,
      applicant_user_id
    ),
    'applicant cannot apply to expired recruiting project'
  );

  -- owner can propose from future recruiting project
  PERFORM pg_temp.rls_set_auth(owner_auth_id);
  PERFORM pg_temp.rls_assert_insert_ok(
    format(
      $sql$
      INSERT INTO public.proposals (
        project_id, sender_user_id, receiver_user_id, message, proposal_status
      ) VALUES (%s, %s, %s, 'join us', 'PENDING')
      $sql$,
      future_project_id,
      owner_user_id,
      receiver_user_id
    ),
    'owner can propose from future recruiting project'
  );

  -- owner cannot propose from expired recruiting project
  PERFORM pg_temp.rls_assert_insert_blocked(
    format(
      $sql$
      INSERT INTO public.proposals (
        project_id, sender_user_id, receiver_user_id, message, proposal_status
      ) VALUES (%s, %s, %s, 'too late', 'PENDING')
      $sql$,
      expired_project_id,
      owner_user_id,
      receiver_user_id
    ),
    'owner cannot propose from expired recruiting project'
  );

  -- legacy recruiting project with null deadline remains eligible
  PERFORM pg_temp.rls_set_auth(applicant_auth_id);
  PERFORM pg_temp.rls_assert_count(
    format('SELECT 1 FROM public.projects WHERE id = %s', legacy_null_project_id),
    1,
    'legacy recruiting project with null deadline remains eligible'
  );

  PERFORM pg_temp.rls_reset_role();
  RAISE NOTICE 'Project recruitment migration contract checks completed successfully.';
END;
$rls$;

ROLLBACK;
