# Remote Supabase Rollout and Backend Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile and deploy the missing Supabase migrations safely, restore the missing application RPCs and proposals table, then complete B3/B5/B6/B7/B9 with deadline-aware server behavior and verified API responses.

**Architecture:** Treat `frontend/supabase/migrations/` as the authoritative schema history and repair only the migration-history timestamp that is proven SQL-equivalent. Deploy the missing history in order, verify PostgREST schema cache/RLS/grants/advisors, hand off remote type generation, and only then update feature repositories and pure domain guards. Keep deadline and eligibility rules in both server guards and RLS: the server returns useful domain errors, while RLS remains the final authorization boundary.

**Tech Stack:** Supabase PostgreSQL 17, PostgREST, Supabase CLI, Next.js 16 App Router, TypeScript 6, Node test runner.

## Global Constraints

- Remote project is `cwbmfnenunqzwwypqipc` (`capus_link`, `ap-southeast-2`).
- Do not apply only `20260714014554` and `20260714014555`; remote is missing `202607100001`, `202607100002`, and `202607100003`, which provide identity mapping, RLS, application RPCs, and `public.proposals`. A CLI-generated matching-eligibility RPC migration must follow `20260714014555` in the same rollout.
- The observed RPC error is a schema-deployment failure, not a route parameter bug: `public.applicant_withdraw_application(bigint)` does not exist remotely.
- Do not patch the generated Next.js `.next` bundle or catch-and-hide the missing-RPC error.
- Do not enable RLS by itself. Apply RLS policies, RPC grants, table grants, and PostgREST cache verification as one rollout unit.
- Do not use `service_role` in browser code or to bypass domain authorization.
- Do not use `migration repair` until SQL equivalence between local `202607090001` and remote `20260709093019` has been recorded.
- Do not continue the rollout if the recoverable backup/snapshot is unconfirmed.
- Normalize legacy `expected_member_count = 0` to `NULL`; zero means “not supplied,” while positive values remain unchanged.
- `recruitment_deadline = current_date` remains eligible; a date before `current_date` is closed.
- A null deadline remains eligible only for legacy compatibility, matching migration `20260714014555`.
- `anon` receives no DML privileges on MVP tables; `authenticated` and `service_role` receive only the table/sequence access required by the existing Data API.
- Another worker owns `frontend/src/lib/supabase/database.types.ts` generation after the remote schema push. Do not hand-edit that file in the backend implementation commit.
- Follow the local Next.js 16 route documentation under `frontend/node_modules/next/dist/docs/` before changing route handlers.
- Every remote write has a read-only preflight, an explicit expected result, and a stop condition.

---

## Confirmed Root Cause and Remote Baseline

The failing call path is:

```text
POST /api/applications/{applicationId}/withdraw
  -> withdrawApplicationForSession()
  -> applicationRepository.applicantWithdraw()
  -> supabase.rpc("applicant_withdraw_application", { p_application_id })
  -> PostgREST schema lookup
  -> function absent in remote pg_proc and schema cache
```

Read-only inspection on 2026-07-14 established:

```text
remote migration tail: 20260709093019_add_cover_image_name_fields
local equivalent file: 202607090001_cover_image_fields.sql
SQL equivalence: both add cover_image_name varchar(255) to projects and portfolio_items
remote missing: 202607100001, 202607100002, 202607100003, 20260714014554, 20260714014555
RLS: disabled on users, profiles, portfolio_items, projects, applications
policies: zero on all five tables
proposals table: absent
current_app_user_id(): absent
owner_decide_application(bigint,text): absent
applicant_withdraw_application(bigint): absent
remote expected_member_count values: 5 rows at 0
invalid application/recruitment enum values: zero
auth links: 7 linked, 0 unlinked, 0 orphaned
security advisor: five rls_disabled_in_public errors
performance advisor: no findings
```

The repository's generated types currently describe RPCs and `proposals` that the remote schema does not have. This explains why typecheck can pass while runtime PostgREST fails.

---

## Planned File Map

- Modify: `frontend/supabase/migrations/20260714014554_grant_public_table_privileges_for_data_api.sql` — explicitly revoke `anon` DML/default privileges and grant the intended authenticated/service-role surface.
- Modify: `frontend/supabase/migrations/20260714014555_project_recruitment_status_and_deadline.sql` — normalize legacy zero member counts before adding the positive-value constraint.
- Modify: `frontend/supabase/tests/project-recruitment-migration.sql` — prove legacy zero normalization, grants, RLS, and deadline boundaries.
- Create via CLI: `frontend/supabase/migrations/<CLI-generated timestamp>_matching_eligibility_contract.sql` — expose only receiver eligibility flags needed by B6 without broadening `users` RLS.
- Modify: `frontend/supabase/tests/rls-p0.sql` — prove the matching-eligibility RPC requires authentication and returns only safe flags.
- Create: `frontend/src/features/matching/server/recruitment-eligibility.ts` — pure deadline and account/profile eligibility guards shared by application and proposal creation.
- Create: `frontend/src/features/matching/server/recruitment-eligibility.test.mjs` — deterministic date and eligibility tests.
- Modify: `frontend/src/features/applications/server/applications.ts` — enforce applicant eligibility/deadline and validate transition results.
- Modify: `frontend/src/features/applications/server/applications.repository.ts` — select deadline and profile eligibility inputs and return typed RPC rows.
- Modify: `frontend/src/features/applications/server/applications.guards.ts` — keep ownership/duplicate/pending guards; consume the shared deadline guard.
- Modify: `frontend/src/features/applications/server/applications.transitions.test.mjs` — B3/B5 application create and transition response contract tests.
- Modify: `frontend/src/features/proposals/server/proposals.ts` — enforce sender/receiver/project/deadline rules.
- Modify: `frontend/src/features/proposals/server/proposals.repository.ts` — fetch receiver eligibility and project deadline.
- Modify: `frontend/src/features/proposals/server/proposals.guards.ts` — validate the additional proposal creation conditions.
- Modify: `frontend/src/features/proposals/server/proposals.transitions.test.mjs` — B6 condition tests.
- Modify: `frontend/src/features/recommendations/server/recommendations.ts` — exclude closed/expired projects before scoring.
- Modify: `frontend/src/features/recommendations/server/recommendations.repository.ts` — select and map `recruitment_deadline`.
- Modify: `frontend/src/features/recommendations/server/recommendations.test.mjs` — B3 recommendation exposure tests.
- Modify: `frontend/src/features/projects/server/projects.ts` — expose `listMyProjectsForSession()` and include new schema fields in DTOs.
- Modify: `frontend/src/features/projects/server/projects.repository.ts` — add owner-filtered `listMine()` and map project/recruitment state.
- Create: `frontend/src/app/api/projects/mine/route.ts` — authenticated `GET /api/projects/mine`.
- Create: `frontend/src/features/projects/server/projects.mine.test.mjs` — B7 input/output contract tests around the pure mine-list mapping/filter contract.
- Create: `frontend/supabase/tests/remote-rollout-smoke.sql` — read-only post-deploy schema/RLS/grant/RPC assertions.
- Modify: `docs/week2-manual-test-checklist.md` — record B3/B5/B6/B7 smoke cases and the type-generation handoff.
- Handoff only: `frontend/src/lib/supabase/database.types.ts` — regenerated by the designated worker after remote deployment.

---

### Task 1: Freeze Writes and Capture a Recoverable Remote Baseline

**Files:**
- Read: `frontend/supabase/migrations/*.sql`
- Read: `frontend/supabase/tests/rls-p0.sql`
- Record operational output in the rollout ticket/PR, not in a secrets-bearing repository file.

**Interfaces:**
- Consumes: linked remote project `cwbmfnenunqzwwypqipc` and operator access.
- Produces: backup confirmation, row counts, exact migration history, and an abortable rollout window.

- [ ] **Step 1: Discover the installed CLI syntax**

Run from `frontend` on Windows using `npx.cmd`:

```powershell
npx.cmd supabase --version
npx.cmd supabase migration --help
npx.cmd supabase migration repair --help
npx.cmd supabase db push --help
npx.cmd supabase gen types --help
```

Expected: every command exits `0`. If `npx.cmd` attempts a package download, stop and install/use the repository-approved CLI version before any remote write.

- [ ] **Step 2: Confirm linkage and migration divergence**

```powershell
npx.cmd supabase status
npx.cmd supabase migration list --linked
```

Expected: the linked ref is `cwbmfnenunqzwwypqipc`; remote contains `20260709093019` while local contains `202607090001`, and remote lacks the five migrations listed in Global Constraints.

- [ ] **Step 3: Confirm a recoverable backup**

Use the project's Supabase backup/PITR capability and record the recovery point immediately before the rollout. Expected: a timestamp or snapshot identifier that can restore all five current MVP tables. If no recoverable backup is available, stop.

- [ ] **Step 4: Re-run the data preflight**

Execute read-only SQL:

```sql
select expected_member_count, count(*)
from public.projects
group by expected_member_count
order by expected_member_count nulls first;

select application_status, count(*)
from public.applications
group by application_status
order by application_status;

select recruitment_status, count(*)
from public.projects
group by recruitment_status
order by recruitment_status;

select
  count(*) filter (where auth_user_id is null) as unlinked_users,
  count(*) filter (
    where auth_user_id is not null
      and not exists (select 1 from auth.users au where au.id = users.auth_user_id)
  ) as orphan_links
from public.users;
```

Expected: five `expected_member_count = 0` rows, only supported status values, `unlinked_users = 0`, and `orphan_links = 0`. Any new unsupported status or orphan link stops the rollout.

- [ ] **Step 5: Commit no changes**

This task is operational evidence only. Verify `git status --short` is unchanged.

---

### Task 2: Harden the Unapplied Grants and Status Migrations

**Files:**
- Modify: `frontend/supabase/migrations/20260714014554_grant_public_table_privileges_for_data_api.sql`
- Modify: `frontend/supabase/migrations/20260714014555_project_recruitment_status_and_deadline.sql`
- Modify: `frontend/supabase/tests/project-recruitment-migration.sql`

**Interfaces:**
- Consumes: the confirmed remote legacy values and existing migration contract.
- Produces: migrations that can apply to the real dataset and leave `anon` without MVP DML privileges.

- [ ] **Step 1: Add failing SQL assertions for normalized counts and least privilege**

In `project-recruitment-migration.sql`, add assertions equivalent to:

```sql
do $$
begin
  if exists (
    select 1 from public.projects
    where expected_member_count is not null
      and expected_member_count <= 0
  ) then
    raise exception '[FAIL] non-positive expected_member_count remains';
  end if;

  if has_table_privilege('anon', 'public.projects', 'SELECT,INSERT,UPDATE,DELETE')
     or has_table_privilege('anon', 'public.applications', 'SELECT,INSERT,UPDATE,DELETE')
     or has_table_privilege('anon', 'public.proposals', 'SELECT,INSERT,UPDATE,DELETE') then
    raise exception '[FAIL] anon retains MVP table DML';
  end if;
end;
$$;
```

Run against a pre-migration local fixture containing `expected_member_count = 0`. Expected: failure before modifying the migrations.

- [ ] **Step 2: Normalize legacy zero values inside `20260714014555`**

Immediately before adding `projects_expected_member_count_positive_check`, add:

```sql
update public.projects
set expected_member_count = null
where expected_member_count is not null
  and expected_member_count <= 0;
```

This preserves positive counts and represents the existing zero placeholder as unknown. Do not delete project rows.

- [ ] **Step 3: Revoke the current and future `anon` DML surface in `20260714014554`**

Add before authenticated grants:

```sql
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
```

Keep the existing explicit grants to `authenticated` and `service_role`. Do not grant `TRUNCATE`, `REFERENCES`, or `TRIGGER` to application roles.

- [ ] **Step 4: Prove both migrations from a clean local database**

```powershell
npx.cmd supabase db reset --local
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f supabase\tests\rls-p0.sql
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f supabase\tests\project-recruitment-migration.sql
```

Expected: reset succeeds, every SQL assertion passes, and the transaction rolls back cleanly.

- [ ] **Step 5: Commit the hardened migrations and test**

```powershell
git add frontend/supabase/migrations/20260714014554_grant_public_table_privileges_for_data_api.sql frontend/supabase/migrations/20260714014555_project_recruitment_status_and_deadline.sql frontend/supabase/tests/project-recruitment-migration.sql
git commit -m "fix: harden remote recruitment rollout"
```

---

### Task 3: Reconcile the Proven Cover-Image Migration Timestamp

**Files:**
- Read: `frontend/supabase/migrations/202607090001_cover_image_fields.sql`
- Read-only remote source: `supabase_migrations.schema_migrations` row `20260709093019`.

**Interfaces:**
- Consumes: exact local and remote SQL statements.
- Produces: migration history where the schema-equivalent migration is represented by local version `202607090001` exactly once.

- [ ] **Step 1: Save and compare normalized SQL evidence**

Confirm both sides normalize to:

```sql
alter table public.projects
  add column if not exists cover_image_name varchar(255);

alter table public.portfolio_items
  add column if not exists cover_image_name varchar(255);
```

Expected: no semantic difference. If a type, table, or column differs, stop and replace this repair task with a schema reconciliation migration.

- [ ] **Step 2: Confirm both columns already exist remotely**

```sql
select table_name, column_name, data_type, character_maximum_length
from information_schema.columns
where table_schema = 'public'
  and table_name in ('projects', 'portfolio_items')
  and column_name = 'cover_image_name'
order by table_name;
```

Expected: two `character varying(255)` rows.

- [ ] **Step 3: Repair history, not schema**

First use the flags shown by `migration repair --help`. With the linked project explicitly confirmed, run the CLI-equivalent of:

```powershell
npx.cmd supabase migration repair --status reverted 20260709093019
npx.cmd supabase migration repair --status applied 202607090001
```

Expected: the schema is unchanged; only migration history changes. Do not use `--include-all` or edit `supabase_migrations.schema_migrations` directly.

- [ ] **Step 4: Verify the repaired list before push**

```powershell
npx.cmd supabase migration list --linked
npx.cmd supabase db push --dry-run
```

Expected: no remote-only `20260709093019`, `202607090001` is paired local/remote, and the dry run lists exactly:

```text
202607100001_auth_identity_and_mvp_constraints
202607100002_rls_p0_policies
202607100003_proposals_and_contact_disclosure
20260714014554_grant_public_table_privileges_for_data_api
20260714014555_project_recruitment_status_and_deadline
```

Task 4 adds one later migration; run a final dry run there before deployment.

If the list differs, stop before `db push`.

---

### Task 4: Add the Least-Privilege Matching Eligibility RPC

**Files:**
- Create via CLI: `frontend/supabase/migrations/<CLI-generated timestamp>_matching_eligibility_contract.sql`
- Modify: `frontend/supabase/tests/rls-p0.sql`

**Interfaces:**
- Consumes: `current_app_user_id()`, `users.email_verified`, and profile onboarding/collaboration state.
- Produces: `get_matching_eligibility(p_user_id bigint)` returning only safe authorization flags to authenticated callers.

- [ ] **Step 1: Add failing SQL tests**

Extend `rls-p0.sql` to assert:

```text
anon cannot execute get_matching_eligibility
unauthenticated invocation raises UNAUTHORIZED
authenticated sender can query an existing receiver
result exposes user_id, email_verified, onboarding_completed, collaboration_status only
missing receiver returns no row
```

Expected before the migration: `to_regprocedure('public.get_matching_eligibility(bigint)')` is null.

- [ ] **Step 2: Generate the migration using the CLI**

```powershell
npx.cmd supabase migration new matching_eligibility_contract
```

Expected: one timestamp greater than `20260714014555`. Use the emitted filename unchanged.

- [ ] **Step 3: Implement the RPC with a fixed authorization boundary**

```sql
create or replace function public.get_matching_eligibility(p_user_id bigint)
returns table (
  user_id bigint,
  email_verified boolean,
  onboarding_completed boolean,
  collaboration_status varchar
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if public.current_app_user_id() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  return query
  select
    u.id,
    u.email_verified,
    p.onboarding_completed,
    p.collaboration_status
  from public.users u
  join public.profiles p on p.user_id = u.id
  where u.id = p_user_id;
end;
$$;

revoke all on function public.get_matching_eligibility(bigint) from public, anon;
grant execute on function public.get_matching_eligibility(bigint)
  to authenticated, service_role;
```

Do not return email, auth UUID, or other private user columns.

- [ ] **Step 4: Reset and prove the full local sequence**

```powershell
npx.cmd supabase db reset --local
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f supabase\tests\rls-p0.sql
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f supabase\tests\project-recruitment-migration.sql
npx.cmd supabase db push --dry-run
```

Expected: all tests pass, and the dry run lists the five existing missing migrations followed by exactly one generated `matching_eligibility_contract` migration.

- [ ] **Step 5: Commit**

```powershell
git add frontend/supabase/migrations frontend/supabase/tests/rls-p0.sql
git commit -m "feat: add matching eligibility rpc"
```

---

### Task 5: Push the Missing Schema and Restore the RPCs

**Files:**
- Deploy: the five migrations listed in Task 3.
- Create: `frontend/supabase/tests/remote-rollout-smoke.sql`

**Interfaces:**
- Consumes: repaired history, hardened migrations, and backup confirmation.
- Produces: RLS-enabled remote tables, application/proposal RPCs, proposals table, grants, and deadline schema.

- [ ] **Step 1: Write the post-deploy smoke assertions before deployment**

Create `remote-rollout-smoke.sql` with read-only assertions for:

```sql
select to_regprocedure('public.current_app_user_id()');
select to_regprocedure('public.owner_decide_application(bigint,text)');
select to_regprocedure('public.applicant_withdraw_application(bigint)');
select to_regprocedure('public.receiver_decide_proposal(bigint,text)');
select to_regprocedure('public.sender_cancel_proposal(bigint)');
select to_regprocedure('public.get_matching_eligibility(bigint)');
select to_regclass('public.proposals');

select relname, relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and relname in ('users','profiles','portfolio_items','projects','applications','proposals')
order by relname;

select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'projects'
  and column_name in ('project_status','recruitment_deadline')
order by column_name;
```

Wrap checks in `DO` blocks that raise `[FAIL]` unless all six tables have RLS enabled, all six functions resolve, `proposals` resolves, `anon` has no DML, authenticated grants exist, and both project columns exist.

- [ ] **Step 2: Push once during the agreed window**

```powershell
npx.cmd supabase db push
```

Expected: the five existing missing migrations and the new matching-eligibility migration apply in timestamp order. If any migration fails, do not run `repair`; capture the exact failing statement and inspect actual schema/data first.

- [ ] **Step 3: Refresh PostgREST schema cache explicitly**

After the push commits:

```sql
notify pgrst, 'reload schema';
```

Expected: command succeeds. This is the documented response when newly created functions are not yet recognized by PostgREST.

- [ ] **Step 4: Run the remote smoke file**

```powershell
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f supabase\tests\remote-rollout-smoke.sql
```

Expected: all assertions pass. Specifically, `to_regprocedure('public.applicant_withdraw_application(bigint)')` is non-null.

- [ ] **Step 5: Verify advisors and history**

Run both Supabase Security and Performance Advisors, then:

```powershell
npx.cmd supabase migration list --linked
```

Expected: the five prior RLS errors are gone, no new security error is introduced, and history ends at `20260714014555`.

- [ ] **Step 6: Smoke the exact failing operation with a disposable pending application**

Using two test accounts, create a fresh pending application, call:

```http
POST /api/applications/{applicationId}/withdraw
```

Expected HTTP response:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "application_status": "CANCELED"
  }
}
```

The actual ID varies. A second call must return `409 INVALID_STATE_TRANSITION`; it must not return a schema-cache error.

- [ ] **Step 7: Commit the smoke test**

```powershell
git add frontend/supabase/tests/remote-rollout-smoke.sql
git commit -m "test: verify remote supabase rollout contract"
```

---

### Task 6: Hand Off Remote Type Generation

**Files:**
- Handoff target: `frontend/src/lib/supabase/database.types.ts`

**Interfaces:**
- Consumes: verified remote schema through `20260714014555`.
- Produces: a separate worker commit containing generated types for `project_status`, `recruitment_deadline`, `proposals`, and all RPCs.

- [ ] **Step 1: Send the type-generation worker an immutable handoff**

Provide:

```text
project ref: cwbmfnenunqzwwypqipc
required migration tail: 20260714014555
output file: frontend/src/lib/supabase/database.types.ts
command family: npx.cmd supabase gen types typescript --project-id cwbmfnenunqzwwypqipc
```

The worker must use the exact flags printed by `npx.cmd supabase gen types --help` and write stdout to the target file without manual additions.

- [ ] **Step 2: Verify the generated diff**

The type diff must include:

```text
projects.Row.project_status: string
projects.Row.recruitment_deadline: string | null
projects.Insert/Update equivalents
proposals table relationships
applicant_withdraw_application Args.p_application_id
owner_decide_application Args.p_application_id / p_decision
receiver_decide_proposal and sender_cancel_proposal
get_matching_eligibility Args.p_user_id and safe flag return rows
```

Expected: the comment `manually extended until cloud schema regeneration catches up` is removed because the remote is now authoritative.

- [ ] **Step 3: Integrate the worker commit before backend changes**

```powershell
npm run typecheck
```

Expected: current code typechecks against generated remote types. If generated RPC return types differ from current casts, preserve the generated truth and fix repositories in Tasks 7–8.

---

### Task 7: Add Shared Deadline and Participant Eligibility Guards (B3/B6)

**Files:**
- Create: `frontend/src/features/matching/server/recruitment-eligibility.ts`
- Create: `frontend/src/features/matching/server/recruitment-eligibility.test.mjs`

**Interfaces:**
- Produces: `isRecruitmentOpen(project, today)`, `assertRecruitmentOpen(project, today)`, `assertActorEligible(profile)`, and `assertProposalReceiverEligible(profile)`.

- [ ] **Step 1: Write failing pure tests**

Cover these exact cases:

```javascript
test("recruiting with future, today, or legacy-null deadline is open", () => {});
test("closed status is never open", () => {});
test("past deadline is closed", () => {});
test("actor must be email verified and onboarding complete", () => {});
test("proposal receiver must be onboarding complete and collaboration OPEN", () => {});
```

Use an injected ISO date such as `2026-07-14`; do not depend on the test machine clock.

- [ ] **Step 2: Run and confirm the missing-module failure**

```powershell
node --test src/features/matching/server/recruitment-eligibility.test.mjs
```

Expected: failure because the module/functions do not exist.

- [ ] **Step 3: Implement the pure contract**

Use these shapes:

```typescript
export type RecruitmentGateProject = {
  recruitment_status: string;
  recruitment_deadline: string | null;
};

export type MatchingEligibility = {
  email_verified: boolean;
  onboarding_completed: boolean;
  collaboration_status: string;
};

export function isoDateUtc(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function isRecruitmentOpen(project: RecruitmentGateProject, today: string) {
  return project.recruitment_status === "RECRUITING" &&
    (project.recruitment_deadline === null || project.recruitment_deadline >= today);
}
```

`assertRecruitmentOpen` throws `INVALID_STATE_TRANSITION`; actor/receiver eligibility failures throw `FORBIDDEN` with stable Korean user-facing messages. Server comparison must match the database's date-only `>= current_date` boundary.

- [ ] **Step 4: Run the focused tests**

```powershell
node --test src/features/matching/server/recruitment-eligibility.test.mjs
```

Expected: all five tests pass.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/features/matching/server/recruitment-eligibility.ts frontend/src/features/matching/server/recruitment-eligibility.test.mjs
git commit -m "feat: add recruitment eligibility guards"
```

---

### Task 8: Complete Application Creation and Transition Response Validation (B3/B5)

**Files:**
- Modify: `frontend/src/features/applications/server/applications.ts`
- Modify: `frontend/src/features/applications/server/applications.repository.ts`
- Modify: `frontend/src/features/applications/server/applications.guards.ts`
- Modify: `frontend/src/features/applications/server/applications.transitions.test.mjs`

**Interfaces:**
- Consumes: shared eligibility guards and generated RPC types.
- Produces: deadline-safe application creation and validated `ACCEPTED | REJECTED | CANCELED` transition responses.

- [ ] **Step 1: Add failing guard and response tests**

Add cases proving:

```text
past deadline -> INVALID_STATE_TRANSITION
deadline today -> allowed
unverified or incomplete applicant -> FORBIDDEN
accept returns the requested application id and ACCEPTED
reject returns the requested application id and REJECTED
withdraw returns the requested application id and CANCELED
RPC null, wrong id, or wrong status -> INTERNAL_ERROR
already transitioned application -> INVALID_STATE_TRANSITION
```

- [ ] **Step 2: Run the focused test and confirm failure**

```powershell
node --test src/features/applications/server/applications.transitions.test.mjs
```

Expected: new deadline/eligibility/response-contract cases fail.

- [ ] **Step 3: Extend repository inputs**

Change `ProjectSummaryRow` to select:

```typescript
"id" | "owner_user_id" | "title" | "campus" |
"recruitment_status" | "recruitment_deadline" | "required_roles"
```

Add an applicant eligibility query reading the current user's own `users.email_verified` and `profiles.onboarding_completed/collaboration_status` through two explicitly filtered reads. This works with `users_select_self`; always filter by the current user ID even though RLS also applies.

- [ ] **Step 4: Enforce server eligibility before duplicate lookup/insert**

In `createApplication`, execute in this order:

```text
validate payload
load project
assert not owner
assert recruitment status/deadline open
assert applicant email verified and onboarding complete
assert target role belongs to required_roles
check duplicate
insert PENDING application
```

This produces stable domain errors while `applications_insert_own_pending` remains the final RLS check.

- [ ] **Step 5: Validate transition RPC results**

Add a pure helper with this signature:

```typescript
export function assertApplicationTransitionResult(
  value: unknown,
  applicationId: number,
  expectedStatus: "ACCEPTED" | "REJECTED" | "CANCELED",
): ApplicationDetailRow;
```

It must reject null/arrays, require `id === applicationId`, and require the exact expected status. Call it after `ownerDecide` and `applicantWithdraw` before returning to the route. Do not cast unvalidated RPC data directly into a successful API response.

- [ ] **Step 6: Run focused and type tests**

```powershell
node --test src/features/applications/server/applications.transitions.test.mjs
npm run typecheck
```

Expected: focused tests and typecheck pass.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/features/applications/server
git commit -m "feat: validate application creation and transitions"
```

---

### Task 9: Complete Proposal Creation Conditions (B6)

**Files:**
- Modify: `frontend/src/features/proposals/server/proposals.ts`
- Modify: `frontend/src/features/proposals/server/proposals.repository.ts`
- Modify: `frontend/src/features/proposals/server/proposals.guards.ts`
- Modify: `frontend/src/features/proposals/server/proposals.transitions.test.mjs`

**Interfaces:**
- Consumes: `RecruitmentGateProject`, `MatchingEligibility`, and generated proposal types.
- Produces: proposals only from an eligible owner, for an owned open project, to an eligible distinct receiver, without duplicates.

- [ ] **Step 1: Add failing B6 tests**

Add cases for:

```text
non-owner cannot propose
closed project cannot propose
past-deadline project cannot propose
deadline-today project can propose
sender must be verified and onboarding complete
receiver must exist
receiver must be verified, onboarding complete, and collaboration OPEN
sender cannot equal receiver
same project/sender/receiver duplicate is rejected
```

- [ ] **Step 2: Run and confirm the new cases fail**

```powershell
node --test src/features/proposals/server/proposals.transitions.test.mjs
```

- [ ] **Step 3: Extend repository summaries**

Select `recruitment_deadline` with the project. Add:

```typescript
findMatchingEligibility(userId: number): Promise<MatchingEligibility | null>;
```

Implement this with `supabase.rpc("get_matching_eligibility", { p_user_id: userId })`, because `users_select_self` correctly prevents a sender from reading another user's `users` row directly. A missing receiver becomes `NOT_FOUND`; an ineligible receiver becomes `FORBIDDEN`. Do not use the admin client.

- [ ] **Step 4: Enforce the creation sequence**

```text
validate IDs
assert sender != receiver
load sender eligibility
load owned project and assert open deadline
load receiver eligibility
assert receiver matchable
check duplicate
insert PENDING proposal
```

Keep RLS policy `proposals_insert_sender_pending` as the database backstop.

- [ ] **Step 5: Run tests and commit**

```powershell
node --test src/features/proposals/server/proposals.transitions.test.mjs
npm run typecheck
git add frontend/src/features/proposals/server
git commit -m "feat: enforce proposal creation eligibility"
```

---

### Task 10: Block Closed and Expired Recommendation Exposure (B3)

**Files:**
- Modify: `frontend/src/features/recommendations/server/recommendations.ts`
- Modify: `frontend/src/features/recommendations/server/recommendations.repository.ts`
- Modify: `frontend/src/features/recommendations/server/recommendations.test.mjs`

**Interfaces:**
- Consumes: generated `projects.recruitment_deadline` and `isRecruitmentOpen()`.
- Produces: ranked project recommendations containing only currently eligible projects.

- [ ] **Step 1: Add failing recommendation tests**

Add candidates for `CLOSED`, yesterday, today, future, and legacy-null deadlines. Assert output includes today/future/null and excludes closed/yesterday before scoring.

- [ ] **Step 2: Replace the legacy `endDate` deadline input**

Change candidate shape to:

```typescript
recruitmentDeadline: string | null;
```

Select `recruitment_deadline` in `PROJECT_SELECT` and map it without using `end_date` as the recommendation deadline.

- [ ] **Step 3: Filter before mapping/scoring**

In `rankProjects`, apply `isRecruitmentOpen(project, today)` before calculating any score. Keep own-project and already-applied exclusion. Remove deadline points for projects that should not be exposed; do not merely rank expired rows lower.

- [ ] **Step 4: Run and commit**

```powershell
node --test src/features/recommendations/server/recommendations.test.mjs
npm run typecheck
git add frontend/src/features/recommendations/server
git commit -m "feat: hide expired project recommendations"
```

---

### Task 11: Add `GET /api/projects/mine` (B7)

**Files:**
- Create: `frontend/src/app/api/projects/mine/route.ts`
- Modify: `frontend/src/features/projects/server/projects.ts`
- Modify: `frontend/src/features/projects/server/projects.repository.ts`
- Create: `frontend/src/features/projects/server/projects.mine.test.mjs`

**Interfaces:**
- Produces: authenticated owner-filtered project list using the existing `{ success, data }` envelope.

- [ ] **Step 1: Add failing service contract tests**

Prove unauthenticated returns the service sentinel used by routes, owner ID is passed to `listMine`, and mapped records include `projectStatus` and `recruitmentDeadline`.

- [ ] **Step 2: Add owner-filtered repository method**

```typescript
listMine(ownerUserId: number): Promise<ProjectRecord[]>;
```

The PostgREST query must include:

```typescript
.from("projects")
.select(PROJECT_SELECT)
.eq("owner_user_id", ownerUserId)
.order("created_at", { ascending: false })
```

Do not reuse the public list filters, because `/mine` must return the owner's closed and expired rows as well.

- [ ] **Step 3: Add the session service**

```typescript
export async function listMyProjectsForSession() {
  const currentUser = await getCurrentAppUser();
  if (!currentUser) return null;
  return projectRepository.listMine(currentUser.id);
}
```

- [ ] **Step 4: Add the route**

`GET /api/projects/mine` must call the service, return `apiUnauthorized()` for null, `apiOk(projects)` for success, and `apiErrorFromUnknown(error)` for failures.

- [ ] **Step 5: Run and commit**

```powershell
node --test src/features/projects/server/projects.mine.test.mjs
npm run typecheck
git add frontend/src/app/api/projects/mine frontend/src/features/projects/server
git commit -m "feat: add my projects endpoint"
```

---

### Task 12: Run B9 Backend Regression and Remote Contract Tests

**Files:**
- Verify: all files changed in Tasks 6–10.
- Modify: `docs/week2-manual-test-checklist.md`

**Interfaces:**
- Produces: automated and remote evidence for B3/B5/B6/B7/B9.

- [ ] **Step 1: Run all pure backend tests**

```powershell
node --test src/**/*.test.mjs
```

Expected: all tests pass, including deadline boundaries, transition responses, proposal conditions, recommendation exclusion, and mine-list behavior.

- [ ] **Step 2: Run static verification**

```powershell
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit `0` with generated remote types and no `.next` source edits.

- [ ] **Step 3: Re-run database contracts**

```powershell
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f supabase\tests\rls-p0.sql
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f supabase\tests\project-recruitment-migration.sql
psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f supabase\tests\remote-rollout-smoke.sql
```

Expected: all three scripts pass. If fixture-writing SQL tests are unsafe for the shared project, run them on a schema-equivalent staging/local database and keep `remote-rollout-smoke.sql` read-only on production.

- [ ] **Step 4: Run two-account API smoke tests**

Verify:

```text
application create: future/today success; past/closed rejected
application accept: owner only; response id/status correct
application reject: owner only; response id/status correct
application withdraw: applicant only; response id/CANCELED correct
proposal create: owned open project + eligible receiver only
recommendations: no closed/expired project IDs
GET /api/projects/mine: 401 signed out; only caller-owned rows signed in
repeat transition: 409 INVALID_STATE_TRANSITION
```

- [ ] **Step 5: Re-run advisors**

Expected: no `rls_disabled_in_public` error for any MVP table and no new performance finding caused by the policies/indexes. Link any unrelated warning (such as leaked password protection) separately rather than treating it as this rollout's regression.

- [ ] **Step 6: Update the manual checklist and commit**

Document the exact endpoint/status checks and the type-generation commit hash.

```powershell
git add docs/week2-manual-test-checklist.md
git commit -m "docs: add backend rollout verification"
```

---

## Stop and Rollback Rules

- Before the push: any history mismatch beyond the proven cover-image timestamp aborts the rollout.
- During the push: do not mark a failed migration as applied. Capture the SQL error and inspect actual schema/data.
- After the push: if RLS blocks expected authenticated traffic, inspect policies and JWT identity mapping; do not disable RLS.
- If PostgREST alone cannot see a confirmed `pg_proc` function, run `NOTIFY pgrst, 'reload schema'`; do not recreate the function repeatedly.
- If `20260714014555` encounters new non-positive counts after the preflight, stop writes, re-run the normalization decision, and preserve positive values.
- If a critical regression requires restoration, use the confirmed backup/PITR recovery point and coordinate a maintenance window. Do not attempt ad-hoc reverse SQL against user data.

## Completion Criteria

- Remote history is aligned through `20260714014555` with no duplicate cover-image migration.
- `applicant_withdraw_application(bigint)`, the other transition/contact RPCs, and `get_matching_eligibility(bigint)` resolve in `pg_proc` and through PostgREST.
- `public.proposals` exists and has RLS enabled.
- All six MVP tables have RLS enabled and intended policies.
- `anon` has no MVP DML privileges; authenticated/service-role grants match the migration.
- The five legacy zero member counts are preserved as rows and normalized to `NULL`.
- Application/proposal creation is blocked server-side and by RLS after deadline/closure.
- Recommendations exclude closed and expired projects instead of lowering their score.
- Application accept/reject/withdraw responses contain the requested ID and exact terminal status.
- `GET /api/projects/mine` returns only caller-owned projects and requires authentication.
- Remote-generated types are integrated from the designated worker after schema deployment.
- Node tests, typecheck, lint, build, SQL contracts, API smoke tests, and advisors pass.
