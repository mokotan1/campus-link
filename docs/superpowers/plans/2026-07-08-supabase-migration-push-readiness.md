# Supabase Migration Push Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the local Supabase migrations push cleanly to a fresh or reset remote Supabase database without duplicate migration-version conflicts.

**Architecture:** Keep the existing schema shape and application code. Fix only the migration layer: ensure the base schema exists before all `alter table` migrations, give every migration file a unique timestamp version, and provide an explicit remote cleanup path for the already-partially-applied development database.

**Tech Stack:** Supabase CLI via `npx supabase`, Supabase PostgreSQL, Next.js App Router, TypeScript.

## Global Constraints

- Do not modify frontend runtime code as part of this plan.
- Do not delete user data from a production database.
- Treat the currently linked Supabase project as a development database only if the human confirms it contains no important data.
- Every migration filename must have a unique numeric prefix.
- Run `npm.cmd run typecheck` and `npm.cmd run lint` after local migration changes.
- Use `npx supabase ...` because global `supabase`, `winget`, and `npm install -g supabase` are not available or not supported in this environment.

---

## Current Problem

`npx supabase db push` reached the remote DB, but failed with:

```text
ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
Key (version)=(20260707) already exists.
```

Root causes:

- The remote DB was initially missing `public.users`, so an earlier `alter table public.users` migration failed.
- A new base migration `frontend/supabase/migrations/20260705_initial_schema.sql` now creates the required base tables.
- Three local migration files still share the same version prefix `20260707`:
  - `frontend/supabase/migrations/20260707_applications_api_fields.sql`
  - `frontend/supabase/migrations/20260707_portfolios_api_fields.sql`
  - `frontend/supabase/migrations/20260707_projects_api_fields.sql`
- Two local migration files share the same version prefix `20260708`:
  - `frontend/supabase/migrations/20260708_onboarding_profile_fields.sql`
  - `frontend/supabase/migrations/20260708_school_email_verification.sql`

Supabase migration history keys by version prefix, so those duplicate prefixes must be fixed before another clean push.

---

## Target Migration File List

After Task 1, `frontend/supabase/migrations/` must contain exactly these migration files:

```text
202607050001_initial_schema.sql
202607060001_auth_user_bridge.sql
202607070001_applications_api_fields.sql
202607070002_portfolios_api_fields.sql
202607070003_projects_api_fields.sql
202607080001_onboarding_profile_fields.sql
202607080002_school_email_verification.sql
```

This ordering preserves the original intent:

1. Create base app tables.
2. Add Supabase Auth bridge fields.
3. Add API-specific fields.
4. Add onboarding fields.
5. Add email verification field.

---

### Task 1: Rename Local Migration Files To Unique Versions

**Files:**
- Rename: `frontend/supabase/migrations/20260705_initial_schema.sql`
- Rename: `frontend/supabase/migrations/20260706_auth_user_bridge.sql`
- Rename: `frontend/supabase/migrations/20260707_applications_api_fields.sql`
- Rename: `frontend/supabase/migrations/20260707_portfolios_api_fields.sql`
- Rename: `frontend/supabase/migrations/20260707_projects_api_fields.sql`
- Rename: `frontend/supabase/migrations/20260708_onboarding_profile_fields.sql`
- Rename: `frontend/supabase/migrations/20260708_school_email_verification.sql`

**Interfaces:**
- Consumes: Existing migration SQL contents.
- Produces: Unique Supabase migration versions that can be pushed without local duplicate version conflicts.

- [x] **Step 1: Rename migrations with PowerShell**

Run from `D:\git_camp\campus-link`:

```powershell
Move-Item -LiteralPath frontend/supabase/migrations/20260705_initial_schema.sql -Destination frontend/supabase/migrations/202607050001_initial_schema.sql
Move-Item -LiteralPath frontend/supabase/migrations/20260706_auth_user_bridge.sql -Destination frontend/supabase/migrations/202607060001_auth_user_bridge.sql
Move-Item -LiteralPath frontend/supabase/migrations/20260707_applications_api_fields.sql -Destination frontend/supabase/migrations/202607070001_applications_api_fields.sql
Move-Item -LiteralPath frontend/supabase/migrations/20260707_portfolios_api_fields.sql -Destination frontend/supabase/migrations/202607070002_portfolios_api_fields.sql
Move-Item -LiteralPath frontend/supabase/migrations/20260707_projects_api_fields.sql -Destination frontend/supabase/migrations/202607070003_projects_api_fields.sql
Move-Item -LiteralPath frontend/supabase/migrations/20260708_onboarding_profile_fields.sql -Destination frontend/supabase/migrations/202607080001_onboarding_profile_fields.sql
Move-Item -LiteralPath frontend/supabase/migrations/20260708_school_email_verification.sql -Destination frontend/supabase/migrations/202607080002_school_email_verification.sql
```

Expected:
- No command errors.
- Old duplicate-prefix filenames no longer exist.

- [x] **Step 2: Verify there are no duplicate migration versions**

Run:

```powershell
Get-ChildItem frontend/supabase/migrations | Sort-Object Name | Select-Object Name
```

Expected output contains only:

```text
202607050001_initial_schema.sql
202607060001_auth_user_bridge.sql
202607070001_applications_api_fields.sql
202607070002_portfolios_api_fields.sql
202607070003_projects_api_fields.sql
202607080001_onboarding_profile_fields.sql
202607080002_school_email_verification.sql
```

- [x] **Step 3: Run frontend verification**

Run:

```powershell
cd frontend
npm.cmd run typecheck
npm.cmd run lint
```

Expected:
- Both commands pass.

- [x] **Step 4: Commit local migration readiness changes**

Run from `D:\git_camp\campus-link`:

```powershell
git add frontend/supabase/migrations docs/superpowers/plans/2026-07-08-supabase-migration-push-readiness.md
git commit -m "수파베이스 마이그레이션 버전 정리"
```

Expected:
- Commit succeeds.

---

### Task 2: Inspect Remote Migration History Before Cleanup

**Files:**
- No file changes.

**Interfaces:**
- Consumes: Supabase Dashboard SQL Editor or Supabase CLI access to the linked project.
- Produces: A clear decision on whether to reset/clean the remote development DB.

- [x] **Step 1: Confirm the remote project is development-only**

Ask the human:

```text
이 Supabase 프로젝트에 보존해야 할 실제 사용자/프로젝트/포트폴리오 데이터가 있나요?
```

Expected answer for this plan:

```text
없음. 개발용 DB라 정리 가능.
```

If the answer is not exactly development-only, stop this plan and use Supabase migration repair with a backup-first production plan instead.

- [x] **Step 2: Inspect migration history in Supabase Dashboard**

Open Supabase Dashboard → SQL Editor and run:

```sql
select version, name, statements, inserted_at
from supabase_migrations.schema_migrations
order by version;
```

Expected before cleanup:
- There may be rows such as `20260705`, `20260706`, `20260707`, or `20260708`.
- These rows may not match the renamed local files from Task 1.

- [x] **Step 3: Inspect app tables in Supabase Dashboard**

Run:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('users', 'profiles', 'projects', 'portfolio_items', 'applications')
order by table_name;
```

Expected before cleanup:
- Some or all of the app tables may exist because the previous `db push` partially applied migrations.

---

### Task 3: Clean The Partially Applied Development DB

**Files:**
- No local file changes.

**Interfaces:**
- Consumes: Confirmation from Task 2 that the remote DB has no data to preserve.
- Produces: A remote DB ready to receive the renamed local migrations from scratch.

- [x] **Step 1: Run development-only cleanup SQL**

Only run this if the human confirmed the remote DB has no important data.

Open Supabase Dashboard → SQL Editor and run:

```sql
drop table if exists public.applications cascade;
drop table if exists public.portfolio_items cascade;
drop table if exists public.projects cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade;

delete from supabase_migrations.schema_migrations
where version in (
  '20260705',
  '20260706',
  '20260707',
  '20260708',
  '202607050001',
  '202607060001',
  '202607070001',
  '202607070002',
  '202607070003',
  '202607080001',
  '202607080002'
);
```

Expected:
- SQL runs successfully.
- The app tables are removed.
- Old conflicting migration version records are removed.

- [x] **Step 2: Verify cleanup**

Run:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('users', 'profiles', 'projects', 'portfolio_items', 'applications')
order by table_name;
```

Expected:
- 0 rows.

Run:

```sql
select version, name, inserted_at
from supabase_migrations.schema_migrations
where version like '202607%'
order by version;
```

Expected:
- 0 rows.

---

### Task 4: Push The Renamed Migrations

**Files:**
- No file changes expected.

**Interfaces:**
- Consumes: Renamed migrations from Task 1 and clean remote DB from Task 3.
- Produces: Remote Supabase DB with app schema applied.

- [x] **Step 1: Run Supabase DB push**

Run from `D:\git_camp\campus-link\frontend`:

```powershell
npx supabase db push
```

Expected prompt:

```text
Do you want to push these migrations to the remote database? [Y/n]
```

Type:

```text
y
```

Expected migration list includes:

```text
202607050001_initial_schema.sql
202607060001_auth_user_bridge.sql
202607070001_applications_api_fields.sql
202607070002_portfolios_api_fields.sql
202607070003_projects_api_fields.sql
202607080001_onboarding_profile_fields.sql
202607080002_school_email_verification.sql
```

Expected final result:
- No `duplicate key value violates unique constraint "schema_migrations_pkey"` error.
- No `relation "public.users" does not exist` error.

- [x] **Step 2: Verify migration history**

Run in Supabase Dashboard SQL Editor:

```sql
select version, name, inserted_at
from supabase_migrations.schema_migrations
where version like '202607%'
order by version;
```

Expected rows:

```text
202607050001
202607060001
202607070001
202607070002
202607070003
202607080001
202607080002
```

- [x] **Step 3: Verify required columns exist**

Run:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('users', 'profiles', 'projects', 'portfolio_items', 'applications')
  and column_name in (
    'auth_user_id',
    'campus',
    'email_verified',
    'display_name',
    'role_tags',
    'availability_status',
    'collaboration_type',
    'weekly_hours',
    'onboarding_completed',
    'external_url',
    'role_in_work',
    'required_roles',
    'tools',
    'target_role',
    'application_status'
  )
order by table_name, column_name;
```

Expected:
- `users.auth_user_id`
- `users.campus`
- `users.email_verified`
- `profiles.display_name`
- `profiles.role_tags`
- `profiles.availability_status`
- `profiles.collaboration_type`
- `profiles.weekly_hours`
- `profiles.onboarding_completed`
- `projects.campus`
- `projects.required_roles`
- `projects.tools`
- `portfolio_items.external_url`
- `portfolio_items.role_in_work`
- `portfolio_items.tools`
- `applications.target_role`
- `applications.application_status`

---

### Task 5: Final Local Verification And Report

**Files:**
- No required file changes.

**Interfaces:**
- Consumes: Successful `npx supabase db push`.
- Produces: Handoff summary for the human.

- [x] **Step 1: Run local checks**

Run from `D:\git_camp\campus-link\frontend`:

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Expected:
- Both pass.

- [x] **Step 2: Report final status**

Report in Korean:

```text
Supabase migration push 준비 완료:
- 로컬 migration version 중복 제거 완료
- 초기 schema migration 추가/정리 완료
- 원격 개발 DB의 꼬인 migration 기록 정리 완료
- npx supabase db push 성공
- 필수 app table/column 확인 완료
- typecheck/lint 통과
```

If any step fails, include:

```text
실패한 명령:
실패 메시지:
현재 원격 migration history:
현재 public app table 목록:
다음 조치:
```

---

## Self-Review

**Spec coverage:** This plan covers the current `schema_migrations_pkey` conflict, duplicate local migration version prefixes, missing initial schema, and the exact verification needed before declaring `db push` ready.

**Placeholder scan:** No `TBD`, `TODO`, or open-ended implementation instructions remain. The only human-provided value is the safety confirmation that the remote DB is development-only; the plan stops if that is not true.

**Type consistency:** The migration filenames listed in the target state match the cleanup SQL and expected migration history rows. The required columns match current server code references and existing migration contents.
