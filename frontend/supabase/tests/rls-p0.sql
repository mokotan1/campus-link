-- P0 RLS verification for Campus Link MVP tables.
--
-- Run after migration 202607100002_rls_p0_policies.sql:
--   psql "$SUPABASE_DB_URL" -f supabase/tests/rls-p0.sql
--
-- Connects as a role that bypasses RLS for fixture setup, then impersonates
-- two authenticated subjects via request.jwt.claim.sub (auth.uid()).

\set ON_ERROR_STOP on

BEGIN;

-- ---------------------------------------------------------------------------
-- Test fixtures
-- ---------------------------------------------------------------------------

DO $rls$
DECLARE
  owner_auth_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  other_auth_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  third_auth_id uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  owner_user_id bigint;
  other_user_id bigint;
  third_user_id bigint;

  owner_profile_id bigint;
  other_profile_id bigint;

  recruiting_project_id bigint;
  closed_project_id bigint;
  application_id bigint;
  owner_portfolio_item_id bigint;
BEGIN
  -- auth.users (service-role / postgres connection bypasses RLS)
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
      'rls-owner@test.local',
      crypt('password', gen_salt('bf')),
      now(),
      now(),
      now()
    ),
    (
      other_auth_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'rls-other@test.local',
      crypt('password', gen_salt('bf')),
      now(),
      now(),
      now()
    ),
    (
      third_auth_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'rls-third@test.local',
      crypt('password', gen_salt('bf')),
      now(),
      now(),
      now()
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (email, password_hash, name, role, auth_provider, auth_user_id)
  VALUES
    ('rls-owner@test.local', '', 'Owner', 'STUDENT', 'SUPABASE', owner_auth_id),
    ('rls-other@test.local', '', 'Other', 'STUDENT', 'SUPABASE', other_auth_id),
    ('rls-third@test.local', '', 'Third', 'STUDENT', 'SUPABASE', third_auth_id)
  ON CONFLICT (email) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id;

  SELECT id INTO owner_user_id FROM public.users WHERE auth_user_id = owner_auth_id;
  SELECT id INTO other_user_id FROM public.users WHERE auth_user_id = other_auth_id;
  SELECT id INTO third_user_id FROM public.users WHERE auth_user_id = third_auth_id;

  INSERT INTO public.profiles (user_id, display_name, bio, collaboration_status)
  VALUES
    (owner_user_id, 'Owner Profile', 'owner bio', 'OPEN'),
    (other_user_id, 'Other Profile', 'other bio', 'OPEN')
  ON CONFLICT (user_id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        bio = EXCLUDED.bio;

  SELECT id INTO owner_profile_id FROM public.profiles WHERE user_id = owner_user_id;
  SELECT id INTO other_profile_id FROM public.profiles WHERE user_id = other_user_id;

  INSERT INTO public.projects (
    owner_user_id,
    title,
    summary,
    project_type,
    collaboration_mode,
    recruitment_status,
    required_roles
  )
  VALUES (
    owner_user_id,
    'RLS Recruiting Project',
    'visible to authenticated users',
    'TEAM',
    'ONLINE',
    'RECRUITING',
    ARRAY['Developer']
  )
  RETURNING id INTO recruiting_project_id;

  INSERT INTO public.projects (
    owner_user_id,
    title,
    summary,
    project_type,
    collaboration_mode,
    recruitment_status,
    required_roles
  )
  VALUES (
    owner_user_id,
    'RLS Closed Project',
    'visible only to owner',
    'TEAM',
    'ONLINE',
    'CLOSED',
    ARRAY['Designer']
  )
  RETURNING id INTO closed_project_id;

  INSERT INTO public.portfolio_items (user_id, title, description)
  VALUES (owner_user_id, 'Owner Portfolio Item', 'fixture portfolio')
  RETURNING id INTO owner_portfolio_item_id;

  INSERT INTO public.applications (
    project_id,
    applicant_user_id,
    message,
    application_status,
    target_role
  )
  VALUES (
    recruiting_project_id,
    other_user_id,
    'I want to join',
    'PENDING',
    'Developer'
  )
  RETURNING id INTO application_id;

  PERFORM set_config('rls.owner_auth_id', owner_auth_id::text, true);
  PERFORM set_config('rls.other_auth_id', other_auth_id::text, true);
  PERFORM set_config('rls.third_auth_id', third_auth_id::text, true);
  PERFORM set_config('rls.owner_user_id', owner_user_id::text, true);
  PERFORM set_config('rls.other_user_id', other_user_id::text, true);
  PERFORM set_config('rls.third_user_id', third_user_id::text, true);
  PERFORM set_config('rls.owner_profile_id', owner_profile_id::text, true);
  PERFORM set_config('rls.other_profile_id', other_profile_id::text, true);
  PERFORM set_config('rls.recruiting_project_id', recruiting_project_id::text, true);
  PERFORM set_config('rls.closed_project_id', closed_project_id::text, true);
  PERFORM set_config('rls.application_id', application_id::text, true);
  PERFORM set_config('rls.owner_portfolio_item_id', owner_portfolio_item_id::text, true);
END;
$rls$;

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

CREATE OR REPLACE FUNCTION pg_temp.rls_assert_update_blocked(p_sql text, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  affected integer;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected > 0 THEN
    RAISE EXCEPTION '[FAIL] %: update affected % rows', p_label, affected;
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

CREATE OR REPLACE FUNCTION pg_temp.rls_assert_rpc_blocked(
  p_sql text,
  p_label text,
  p_expected_fragment text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
    RAISE EXCEPTION '[FAIL] %: RPC succeeded unexpectedly', p_label;
  EXCEPTION
    WHEN OTHERS THEN
      IF p_expected_fragment IS NOT NULL
        AND position(lower(p_expected_fragment) in lower(SQLERRM)) = 0 THEN
        RAISE EXCEPTION '[FAIL] %: expected error containing "%", got: %',
          p_label, p_expected_fragment, SQLERRM;
      END IF;
      RAISE NOTICE '[PASS] %', p_label;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.rls_assert_delete_blocked(p_sql text, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  affected integer;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected > 0 THEN
    RAISE EXCEPTION '[FAIL] %: delete affected % rows', p_label, affected;
  END IF;

  RAISE NOTICE '[PASS] %', p_label;
END;
$$;

-- ---------------------------------------------------------------------------
-- Assertions
-- ---------------------------------------------------------------------------

DO $tests$
DECLARE
  owner_auth_id uuid := current_setting('rls.owner_auth_id')::uuid;
  other_auth_id uuid := current_setting('rls.other_auth_id')::uuid;
  third_auth_id uuid := current_setting('rls.third_auth_id')::uuid;
  owner_user_id bigint := current_setting('rls.owner_user_id')::bigint;
  other_user_id bigint := current_setting('rls.other_user_id')::bigint;
  third_user_id bigint := current_setting('rls.third_user_id')::bigint;
  owner_profile_id bigint := current_setting('rls.owner_profile_id')::bigint;
  other_profile_id bigint := current_setting('rls.other_profile_id')::bigint;
  recruiting_project_id bigint := current_setting('rls.recruiting_project_id')::bigint;
  closed_project_id bigint := current_setting('rls.closed_project_id')::bigint;
  application_id bigint := current_setting('rls.application_id')::bigint;
  owner_portfolio_item_id bigint := current_setting('rls.owner_portfolio_item_id')::bigint;
  pending_application_id bigint;
  owner_portfolio_insert_id bigint;
BEGIN
  -- users: self SELECT keeps auth bootstrap working
  PERFORM pg_temp.rls_set_auth(owner_auth_id);
  PERFORM pg_temp.rls_assert_count(
    format('SELECT 1 FROM public.users WHERE id = %s', owner_user_id),
    1,
    'owner can read own users row'
  );
  PERFORM pg_temp.rls_assert_count(
    format('SELECT 1 FROM public.users WHERE id = %s', other_user_id),
    0,
    'owner cannot read another users row'
  );

  -- profiles
  PERFORM pg_temp.rls_assert_count(
    format('SELECT 1 FROM public.profiles WHERE id = %s', owner_profile_id),
    1,
    'owner can read own profile'
  );
  PERFORM pg_temp.rls_set_auth(other_auth_id);
  PERFORM pg_temp.rls_assert_update_blocked(
    format(
      'UPDATE public.profiles SET bio = ''hacked'' WHERE id = %s',
      owner_profile_id
    ),
    'other user cannot update owner profile'
  );
  PERFORM pg_temp.rls_set_auth(owner_auth_id);
  UPDATE public.profiles
  SET bio = 'owner updated bio'
  WHERE id = owner_profile_id;

  -- portfolio_items
  PERFORM pg_temp.rls_set_auth(other_auth_id);
  PERFORM pg_temp.rls_assert_count(
    format('SELECT 1 FROM public.portfolio_items WHERE id = %s', owner_portfolio_item_id),
    1,
    'authenticated user can read another user portfolio item'
  );
  PERFORM pg_temp.rls_assert_update_blocked(
    format(
      'UPDATE public.portfolio_items SET title = ''hacked'' WHERE id = %s',
      owner_portfolio_item_id
    ),
    'other user cannot update owner portfolio item'
  );
  PERFORM pg_temp.rls_assert_delete_blocked(
    format(
      'DELETE FROM public.portfolio_items WHERE id = %s',
      owner_portfolio_item_id
    ),
    'other user cannot delete owner portfolio item'
  );

  PERFORM pg_temp.rls_set_auth(owner_auth_id);
  INSERT INTO public.portfolio_items (user_id, title, description)
  VALUES (owner_user_id, 'Owner New Portfolio Item', 'inserted under RLS')
  RETURNING id INTO owner_portfolio_insert_id;

  PERFORM pg_temp.rls_assert_count(
    format('SELECT 1 FROM public.portfolio_items WHERE id = %s', owner_portfolio_insert_id),
    1,
    'owner can insert own portfolio item'
  );

  UPDATE public.portfolio_items
  SET description = 'owner updated portfolio'
  WHERE id = owner_portfolio_insert_id;

  DELETE FROM public.portfolio_items
  WHERE id = owner_portfolio_insert_id;

  PERFORM pg_temp.rls_assert_count(
    format('SELECT 1 FROM public.portfolio_items WHERE id = %s', owner_portfolio_insert_id),
    0,
    'owner can delete own portfolio item'
  );

  -- projects
  PERFORM pg_temp.rls_set_auth(other_auth_id);
  PERFORM pg_temp.rls_assert_count(
    'SELECT 1 FROM public.projects WHERE recruitment_status = ''RECRUITING''',
    1,
    'authenticated user can list recruiting projects'
  );
  PERFORM pg_temp.rls_assert_count(
    format('SELECT 1 FROM public.projects WHERE id = %s', closed_project_id),
    0,
    'non-owner cannot read closed project'
  );
  PERFORM pg_temp.rls_assert_update_blocked(
    format(
      'UPDATE public.projects SET title = ''hacked'' WHERE id = %s',
      recruiting_project_id
    ),
    'non-owner cannot update recruiting project'
  );
  PERFORM pg_temp.rls_set_auth(owner_auth_id);
  UPDATE public.projects
  SET title = 'Owner updated title'
  WHERE id = recruiting_project_id;

  -- applications: applicant create/read own
  PERFORM pg_temp.rls_set_auth(third_auth_id);
  PERFORM pg_temp.rls_assert_insert_blocked(
    format(
      $sql$
      INSERT INTO public.applications (
        project_id, applicant_user_id, application_status, target_role
      ) VALUES (%s, %s, 'PENDING', 'Developer')
      $sql$,
      recruiting_project_id,
      owner_user_id
    ),
    'third party cannot create application for someone else'
  );
  PERFORM pg_temp.rls_assert_count(
    format(
      'SELECT 1 FROM public.applications WHERE applicant_user_id = %s',
      third_user_id
    ),
    0,
    'third party cannot read applications'
  );

  PERFORM pg_temp.rls_set_auth(other_auth_id);
  PERFORM pg_temp.rls_assert_count(
    format(
      'SELECT 1 FROM public.applications WHERE id = %s AND applicant_user_id = %s',
      application_id,
      other_user_id
    ),
    1,
    'applicant can read own application'
  );

  pending_application_id := application_id;

  PERFORM pg_temp.rls_set_auth(owner_auth_id);
  PERFORM pg_temp.rls_assert_insert_blocked(
    format(
      $sql$
      INSERT INTO public.applications (
        project_id, applicant_user_id, application_status, target_role
      ) VALUES (%s, %s, 'PENDING', 'Developer')
      $sql$,
      recruiting_project_id,
      owner_user_id
    ),
    'owner cannot apply to own recruiting project'
  );

  PERFORM pg_temp.rls_set_auth(other_auth_id);
  PERFORM pg_temp.rls_assert_insert_blocked(
    format(
      $sql$
      INSERT INTO public.applications (
        project_id, applicant_user_id, application_status, target_role
      ) VALUES (%s, %s, 'PENDING', 'Designer')
      $sql$,
      closed_project_id,
      other_user_id
    ),
    'applicant cannot apply to closed project'
  );

  -- applications: RPC negative authorization
  PERFORM pg_temp.rls_set_auth(third_auth_id);
  PERFORM pg_temp.rls_assert_rpc_blocked(
    format(
      'SELECT public.owner_decide_application(%s, ''ACCEPTED'')',
      pending_application_id
    ),
    'third party cannot call owner_decide_application',
    'NOT_FOUND_OR_FORBIDDEN'
  );

  PERFORM pg_temp.rls_set_auth(other_auth_id);
  PERFORM pg_temp.rls_assert_rpc_blocked(
    format(
      'SELECT public.owner_decide_application(%s, ''ACCEPTED'')',
      pending_application_id
    ),
    'applicant cannot call owner_decide_application on own application',
    'NOT_FOUND_OR_FORBIDDEN'
  );

  -- applications: project owner read and transition
  PERFORM pg_temp.rls_set_auth(owner_auth_id);
  PERFORM pg_temp.rls_assert_count(
    format(
      'SELECT 1 FROM public.applications WHERE id = %s',
      application_id
    ),
    1,
    'project owner can read applications for owned project'
  );

  PERFORM public.owner_decide_application(application_id, 'ACCEPTED');

  PERFORM pg_temp.rls_assert_count(
    format(
      $sql$
      SELECT 1 FROM public.applications
      WHERE id = %s AND application_status = 'ACCEPTED'
      $sql$,
      application_id
    ),
    1,
    'project owner can transition application to ACCEPTED'
  );

  PERFORM pg_temp.rls_assert_rpc_blocked(
    format(
      'SELECT public.owner_decide_application(%s, ''REJECTED'')',
      application_id
    ),
    'owner_decide_application on already-ACCEPTED fails with INVALID_TRANSITION',
    'INVALID_TRANSITION'
  );

  PERFORM pg_temp.rls_assert_rpc_blocked(
    format(
      'SELECT public.applicant_withdraw_application(%s)',
      application_id
    ),
    'owner cannot call applicant_withdraw_application on someone else application',
    'NOT_FOUND_OR_FORBIDDEN'
  );

  PERFORM pg_temp.rls_set_auth(other_auth_id);
  PERFORM pg_temp.rls_assert_update_blocked(
    format(
      $sql$
      UPDATE public.applications
      SET application_status = 'REJECTED'
      WHERE id = %s
      $sql$,
      application_id
    ),
    'applicant cannot directly mutate accepted application status'
  );

  -- applicant withdraw on a fresh pending application
  PERFORM pg_temp.rls_set_auth(third_auth_id);
  INSERT INTO public.applications (
    project_id,
    applicant_user_id,
    application_status,
    target_role
  )
  VALUES (
    recruiting_project_id,
    third_user_id,
    'PENDING',
    'Developer'
  )
  ON CONFLICT (project_id, applicant_user_id) DO UPDATE
    SET application_status = 'PENDING'
  RETURNING id INTO application_id;

  PERFORM public.applicant_withdraw_application(application_id);

  PERFORM pg_temp.rls_assert_count(
    format(
      $sql$
      SELECT 1 FROM public.applications
      WHERE id = %s AND application_status = 'CANCELED'
      $sql$,
      application_id
    ),
    1,
    'applicant can withdraw own pending application'
  );

  PERFORM pg_temp.rls_reset_role();
  RAISE NOTICE 'RLS P0 checks completed successfully.';
END;
$tests$;

ROLLBACK;
