# Project Recruitment Database Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split project progress from recruitment state, add an explicit recruitment deadline, enforce deadline-aware application/proposal creation, and add the indexes and SQL verification needed for the new read paths.

**Architecture:** `frontend/supabase/migrations/` is the only authoritative MVP schema history. Add one forward-only Supabase migration after `202607100003_proposals_and_contact_disclosure.sql`; do not edit applied migrations or the inactive Spring/Flyway schema. Preserve legacy projects by copying a non-null `end_date` into the new deadline column and treating a null deadline as an unmigrated open-ended project until the application layer requires dates for new and edited records.

**Tech Stack:** Supabase PostgreSQL, Supabase CLI via `npx supabase`, PostgreSQL RLS, `psql`, PowerShell, SQL transaction-based verification.

## Global Constraints

- Work from a branch that contains every migration currently present on `main`.
- Do not modify `backend/src/main/resources/db/migration/V1__create_mvp_data_tables.sql`; it is not the authoritative runtime schema.
- Do not modify proposal cancellation, acceptance, rejection, or their RPCs: `receiver_decide_proposal()` and `sender_cancel_proposal()`.
- Keep `projects.recruitment_status` limited to `RECRUITING | CLOSED`.
- Add `projects.project_status` with `PREPARING | IN_PROGRESS | COMPLETED`.
- Add `projects.recruitment_deadline date`; do not rename or delete `start_date` or `end_date` in this migration.
- Do not use a time-dependent `CHECK` constraint such as `recruitment_deadline >= current_date`; time-dependent eligibility belongs in RLS and application validation.
- A null `recruitment_deadline` remains temporarily eligible so legacy rows are not silently closed. A later application/API change must require the field for new and edited projects before a separate `NOT NULL` migration is considered.
- Use text columns plus named `CHECK` constraints, matching the existing schema; do not introduce PostgreSQL enum types.
- Create the migration file with `npx supabase migration new`; do not hand-invent its timestamp.
- The migration must be forward-only and idempotent where the repository's existing migration style already uses `if exists`/`if not exists`.
- No new table is created, so existing table grants should remain intact; nevertheless verify Data API grants because [Supabase changed new-project exposure defaults in 2026](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

## Current Schema Context

`public.projects` currently has `recruitment_status`, `start_date`, and `end_date`, but no independent project progress state or explicit recruitment deadline. The UI currently maps `end_date` to a displayed deadline, so the migration copies existing non-null `end_date` values into `recruitment_deadline` without deleting the source value.

The current RLS policies permit application and proposal inserts whenever `recruitment_status = 'RECRUITING'`; they do not consider a deadline. `projects_select_recruiting_or_own` also exposes every `RECRUITING` row, including expired recruitment. Existing application-owner and proposal transition behavior must remain unchanged.

## Planned File Map

- Create via CLI: `frontend/supabase/migrations/<CLI-generated timestamp>_project_recruitment_status_and_deadline.sql` — the timestamp is resolved by `npx supabase migration new` during Task 3; this file owns schema additions, backfill, constraints, indexes, and replacement RLS policies.
- Create: `frontend/supabase/tests/project-recruitment-migration.sql` — focused schema, data-integrity, index, grant, and deadline-aware RLS verification.
- Modify: `docs/SECURITY_GUIDELINES.md` — document the two independent states and deadline-aware insert rules.
- Do not modify: `frontend/supabase/migrations/202607100002_rls_p0_policies.sql` — already-applied history.
- Do not modify: `frontend/supabase/migrations/202607100003_proposals_and_contact_disclosure.sql` — already-applied history and out-of-scope proposal transitions.

---

### Task 1: Confirm the Authoritative Baseline and Preflight Existing Data

**Files:**
- Read: `frontend/supabase/migrations/202607050001_initial_schema.sql`
- Read: `frontend/supabase/migrations/202607100002_rls_p0_policies.sql`
- Read: `frontend/supabase/migrations/202607100003_proposals_and_contact_disclosure.sql`
- Read: `frontend/supabase/tests/rls-p0.sql`

**Interfaces:**
- Consumes: the complete migration sequence through `202607100003` and a privileged `SUPABASE_DB_URL` connection.
- Produces: an audited baseline proving the target database can accept the new constraint and backfill without guessing about existing rows.

- [ ] **Step 1: Verify the implementation branch contains the full migration history**

Run from the repository root:

```powershell
git merge-base --is-ancestor main HEAD
Get-ChildItem frontend\supabase\migrations | Sort-Object Name | Select-Object -ExpandProperty Name
```

Expected: the first command exits `0`, and the list ends with `202607100003_proposals_and_contact_disclosure.sql` before the new migration is generated.

- [ ] **Step 2: Discover the installed Supabase CLI commands instead of assuming flags**

Run:

```powershell
Set-Location frontend
npx supabase --help
npx supabase migration --help
npx supabase db --help
```

Expected: all commands exit `0` and show `migration new`, database reset/push commands, and the locally installed CLI version's supported flags.

- [ ] **Step 3: Audit existing project values on the target development database**

Run:

```powershell
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -c "select recruitment_status, count(*) from public.projects group by recruitment_status order by recruitment_status;"
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -c "select count(*) as invalid_member_counts from public.projects where expected_member_count is not null and expected_member_count <= 0;"
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -c "select count(*) as populated_end_dates from public.projects where end_date is not null;"
```

Expected: only `RECRUITING` and `CLOSED` appear. `invalid_member_counts` must be `0`; otherwise stop and decide how to repair those rows before adding the constraint. Record the `populated_end_dates` count in the PR description because those rows will be copied into `recruitment_deadline`.

- [ ] **Step 4: Verify existing Data API privileges before schema changes**

Run:

```powershell
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -c "select grantee, privilege_type from information_schema.role_table_grants where table_schema = 'public' and table_name in ('projects','applications','proposals') and grantee in ('authenticated','service_role') order by table_name, grantee, privilege_type;"
```

Expected: `authenticated` has the table privileges required by the existing Supabase client operations and RLS remains the row-level authorization boundary. If privileges are absent, treat that as a separate environment repair; do not add broad grants blindly to this feature migration.

### Task 2: Write the Focused Failing SQL Contract Test

**Files:**
- Create: `frontend/supabase/tests/project-recruitment-migration.sql`

**Interfaces:**
- Consumes: the pre-migration schema and the same privileged test connection pattern used by `frontend/supabase/tests/rls-p0.sql`.
- Produces: a transactional test that fails before the migration and proves the schema contract, backfill, indexes, and deadline-aware RLS afterward.

- [ ] **Step 1: Create the test transaction and schema assertions**

Create `frontend/supabase/tests/project-recruitment-migration.sql` with `\set ON_ERROR_STOP on`, `BEGIN`, and `ROLLBACK`. Add assertions against `information_schema.columns` and `pg_constraint` that require:

```sql
projects.project_status varchar not null default 'PREPARING'
projects.recruitment_deadline date
projects_project_status_check
projects_expected_member_count_positive_check
```

Implement assertions as `DO` blocks that `raise exception '[FAIL] ...'` when an expected column or constraint is absent and `raise notice '[PASS] ...'` when present.

- [ ] **Step 2: Add data-integrity assertions**

Inside the same transaction, assert these exact behaviors:

```sql
-- succeeds
insert project with project_status = 'PREPARING';
insert project with project_status = 'IN_PROGRESS';
insert project with project_status = 'COMPLETED';

-- each must raise check_violation
insert project with project_status = 'PAUSED';
insert project with expected_member_count = 0;
insert project with expected_member_count = -1;
```

Use nested `begin ... exception when check_violation then ... end` blocks so an unexpected successful insert raises `[FAIL]`.

- [ ] **Step 3: Add backfill and index assertions**

Assert that every row with a pre-existing non-null `end_date` has the same `recruitment_deadline`, then assert these indexes exist in `pg_indexes`:

```text
projects_owner_recruitment_deadline_idx
projects_recruitment_deadline_idx
applications_project_created_at_idx
```

- [ ] **Step 4: Add deadline-aware RLS fixtures and assertions**

Follow the JWT impersonation pattern from `frontend/supabase/tests/rls-p0.sql`. Create an owner, applicant, receiver, one future-deadline recruiting project, and one expired recruiting project. Assert:

```text
non-owner can read future recruiting project
non-owner cannot read expired recruiting project
owner can read own expired recruiting project
applicant can apply to future recruiting project
applicant cannot apply to expired recruiting project
owner can propose from future recruiting project
owner cannot propose from expired recruiting project
legacy recruiting project with null deadline remains eligible
```

Do not call or redefine `receiver_decide_proposal()` or `sender_cancel_proposal()`.

- [ ] **Step 5: Run the focused test and verify it fails for the missing schema**

Run from `frontend`:

```powershell
psql $env:SUPABASE_DB_URL -f supabase\tests\project-recruitment-migration.sql
```

Expected: FAIL on the first missing `project_status` or `recruitment_deadline` assertion. A connection or authentication error is not an acceptable expected failure.

- [ ] **Step 6: Commit the failing contract test**

```powershell
git add frontend/supabase/tests/project-recruitment-migration.sql
git commit -m "test: define project recruitment migration contract"
```

### Task 3: Generate and Implement the Forward-Only Migration

**Files:**
- Create via CLI: `frontend/supabase/migrations/<CLI timestamp>_project_recruitment_status_and_deadline.sql`

**Interfaces:**
- Consumes: `public.projects`, `public.applications`, `public.proposals`, `public.current_app_user_id()`, and existing policy names.
- Produces: independent project/recruitment states, legacy deadline backfill, static integrity constraints, query indexes, and deadline-aware RLS.

- [ ] **Step 1: Generate the migration with the CLI**

Run from `frontend`:

```powershell
npx supabase migration new project_recruitment_status_and_deadline
$migrationFile = Get-ChildItem supabase\migrations\*_project_recruitment_status_and_deadline.sql | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
$migrationFile
```

Expected: exactly one newly generated file is printed. Use that exact emitted path for every remaining step; do not rename its timestamp.

- [ ] **Step 2: Add the independent state and deadline columns**

Add SQL equivalent to:

```sql
alter table public.projects
  add column if not exists project_status varchar(40) not null default 'PREPARING',
  add column if not exists recruitment_deadline date;

update public.projects
set recruitment_deadline = end_date
where recruitment_deadline is null
  and end_date is not null;
```

Do not clear or rename `end_date`; downstream code still depends on it until a separate API/frontend migration is completed.

- [ ] **Step 3: Add named static constraints**

Use guarded `DO` blocks matching `202607100002_rls_p0_policies.sql` to add:

```sql
constraint projects_project_status_check
  check (project_status in ('PREPARING', 'IN_PROGRESS', 'COMPLETED'))

constraint projects_expected_member_count_positive_check
  check (expected_member_count is null or expected_member_count > 0)
```

Do not add a `current_date`-based CHECK and do not add a `start_date <= end_date` CHECK in this migration: historical `end_date` values have been used as recruitment deadlines, so their project-schedule semantics are not reliable enough for that constraint.

- [ ] **Step 4: Add the read-path indexes**

Add:

```sql
create index if not exists projects_owner_recruitment_deadline_idx
  on public.projects (owner_user_id, recruitment_status, recruitment_deadline);

create index if not exists projects_recruitment_deadline_idx
  on public.projects (recruitment_status, recruitment_deadline);

create index if not exists applications_project_created_at_idx
  on public.applications (project_id, created_at desc);
```

Do not recreate existing single-column proposal indexes.

- [ ] **Step 5: Replace project visibility RLS with deadline-aware visibility**

Drop and recreate `projects_select_recruiting_or_own` so a row is visible when the current user owns it, or when it is recruiting and has no legacy deadline or has not expired:

```sql
drop policy if exists projects_select_recruiting_or_own on public.projects;

create policy projects_select_recruiting_or_own
  on public.projects
  for select
  to authenticated
  using (
    owner_user_id = public.current_app_user_id()
    or (
      recruitment_status = 'RECRUITING'
      and (
        recruitment_deadline is null
        or recruitment_deadline >= current_date
      )
    )
  );
```

- [ ] **Step 6: Replace application INSERT RLS with deadline-aware eligibility**

Drop and recreate `applications_insert_own_pending`, preserving all existing ownership and pending-state checks and adding:

```sql
and (
  p.recruitment_deadline is null
  or p.recruitment_deadline >= current_date
)
```

Do not modify the applicant/project-owner SELECT policies or application transition RPCs.

- [ ] **Step 7: Replace proposal INSERT RLS without touching transitions**

Drop and recreate `proposals_insert_sender_pending`, preserving sender ownership, `PENDING`, project ownership, and `RECRUITING` checks, then add the same null-or-unexpired deadline predicate.

Do not alter:

```text
receiver_decide_proposal(bigint, text)
sender_cancel_proposal(bigint)
proposals_select_sender
proposals_select_receiver
```

- [ ] **Step 8: Review the migration for destructive or out-of-scope statements**

Run:

```powershell
Select-String -Path $migrationFile -Pattern 'drop table|drop column|receiver_decide_proposal|sender_cancel_proposal|security definer'
```

Expected: no matches. Policy drops are allowed and should use exact policy names; table/column drops and transition function changes are forbidden.

### Task 4: Apply Locally and Prove the Migration

**Files:**
- Verify: generated migration from Task 3
- Verify: `frontend/supabase/tests/project-recruitment-migration.sql`
- Verify: `frontend/supabase/tests/rls-p0.sql`

**Interfaces:**
- Consumes: the complete local migration history and SQL tests.
- Produces: repeatable proof that the new migration works and existing P0 authorization behavior remains intact.

- [ ] **Step 1: Reset the local Supabase database from migration history**

Discover the exact flags with `npx supabase db reset --help`, then run the supported local reset command from `frontend`.

Expected: every migration through the newly generated migration applies successfully from an empty database.

- [ ] **Step 2: Run the focused migration test**

```powershell
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f supabase\tests\project-recruitment-migration.sql
```

Expected: all notices are `[PASS]`, the script reaches `ROLLBACK`, and the process exits `0`.

- [ ] **Step 3: Run the existing RLS regression test**

```powershell
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f supabase\tests\rls-p0.sql
```

Expected: all existing P0 checks pass. If the recruiting-project fixture lacks a deadline, it remains eligible through the explicit legacy-null rule.

- [ ] **Step 4: Inspect query plans for the new indexes**

Run `EXPLAIN` for:

```sql
select id
from public.projects
where owner_user_id = 1
  and recruitment_status = 'RECRUITING'
order by recruitment_deadline;

select id
from public.applications
where project_id = 1
order by created_at desc;
```

Expected: on realistic fixture volume, PostgreSQL can choose `projects_owner_recruitment_deadline_idx` and `applications_project_created_at_idx`. Do not force planner settings merely to manufacture an index scan on tiny fixtures.

- [ ] **Step 5: Run Supabase advisors and migration history verification**

Use the exact commands exposed by the installed CLI version, preferring:

```powershell
npx supabase db advisors
npx supabase migration list --local
```

Expected: no new security/performance issue caused by this migration, and the generated migration appears once in local history.

- [ ] **Step 6: Commit the migration and passing test**

```powershell
git add frontend/supabase/migrations frontend/supabase/tests/project-recruitment-migration.sql
git commit -m "feat: separate project and recruitment database state"
```

### Task 5: Document the Security and Rollout Contract

**Files:**
- Modify: `docs/SECURITY_GUIDELINES.md`

**Interfaces:**
- Consumes: the final schema and policy behavior from Tasks 3–4.
- Produces: operator-facing rules for future API/frontend work and remote deployment.

- [ ] **Step 1: Document the independent states**

Add a concise section stating:

```text
recruitment_status: RECRUITING | CLOSED
project_status: PREPARING | IN_PROGRESS | COMPLETED
```

State that changing project progress must never implicitly reopen or close recruitment.

- [ ] **Step 2: Document deadline eligibility**

Record that applications and proposals are insertable only for `RECRUITING` projects whose deadline is null for legacy compatibility or is on/after `current_date`. Owners can still read expired projects, and existing applications/proposals remain readable and processable after recruitment closes.

- [ ] **Step 3: Document the rollout boundary**

State that `recruitment_deadline` remains nullable only for legacy rows. The API/frontend follow-up must require it for project creation/editing; only after legacy data is completed should a separate migration make it `NOT NULL` and remove the null compatibility branch from RLS.

- [ ] **Step 4: Verify documentation and final diff**

```powershell
rg -n "recruitment_status|project_status|recruitment_deadline" docs\SECURITY_GUIDELINES.md frontend\supabase
git diff --check
git status --short
```

Expected: documentation and SQL use the same names and values, `git diff --check` reports no whitespace errors, and only intended migration/test/documentation files are changed.

- [ ] **Step 5: Commit documentation**

```powershell
git add docs/SECURITY_GUIDELINES.md
git commit -m "docs: explain project recruitment database rules"
```

## Remote Rollout Gate

Remote application is deliberately not automatic. Before `npx supabase db push` against the shared project:

1. Confirm the target migration history matches the repository through `202607100003`.
2. Record the preflight row counts from Task 1.
3. Take or confirm a recoverable database backup.
4. Apply first to a disposable/local or staging project.
5. Run both SQL test files against that target.
6. Review Supabase advisors.
7. Apply to the shared project during an agreed window.
8. Repeat schema, policy, and smoke verification after deployment.

Do not repair migration history, delete remote rows, or force-push schema changes as part of this plan.

## Completion Criteria

- `projects.project_status` exists, is non-null, defaults to `PREPARING`, and rejects unsupported values.
- `projects.recruitment_deadline` exists and receives legacy non-null `end_date` values without deleting them.
- Non-positive `expected_member_count` values are rejected.
- Expired recruiting projects are hidden from non-owners and cannot receive new applications or proposals.
- Owners can still read their expired projects.
- Null legacy deadlines remain temporarily compatible and are explicitly documented.
- Required indexes exist without duplicating existing proposal indexes.
- Proposal cancellation/acceptance/rejection functions are unchanged.
- The focused migration test and existing P0 RLS test both pass.
- Supabase migration history and advisors report no new problem.
