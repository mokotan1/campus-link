# Task 6 Handoff: Remote Smoke Test and Post-Deploy Audit

**Captured:** 2026-07-14 (UTC)  
**Project:** `cwbmfnenunqzwwypqipc`  
**Worktree:** `.worktrees/campus-link-project-deadline-create-500`  
**Branch:** `fix/project-deadline-and-create-500`  
**Code HEAD (pre-handoff commit):** `7dc65f771d5e9df435f4022ab17600a98f06e8d1`  
**Overall status:** DONE_WITH_CONCERNS — remote advisors + logs baseline captured; **post-deploy smoke BLOCKED** (no unauthorized deploy / no authenticated create session).

---

## Explicit note: no schema push required

This repair is **application-only**. Remote schema already has:

- `recruitment_deadline` (nullable date)
- `expected_member_count` nullable with `projects_expected_member_count_positive_check` (`IS NULL OR > 0`)

**Do not** run `supabase db push`, `apply_migration`, or any DDL as part of deploying this fix. Deploy the app change only.

---

## What was verified remotely (this task)

### 1. Deploy / authenticated smoke — BLOCKED

| Checklist item | Status | Notes |
| --- | --- | --- |
| Deploy application change without schema push | **BLOCKED** | No push/deploy performed (constraint: prefer not pushing; no clear authorized Vercel/production deploy path used). |
| Authenticated create: future deadline, no expected member count | **BLOCKED** | Requires deployed app (or equivalent prod API) + test-user session. |
| API 201; row: `expected_member_count IS NULL`; `recruitment_deadline` = submitted; `end_date` null unless schedule end | **BLOCKED** | Depends on create smoke. |
| Appears in list / detail / mine with same deadline | **BLOCKED** | Depends on create smoke. |
| Yesterday blocks non-owner visibility + application/proposal; today remains eligible | **BLOCKED** | Depends on create smoke + second actor. |
| Post-smoke logs: no new `projects_expected_member_count_positive_check`; no POST 400/500 for valid create | **BLOCKED** | Re-check after deploy + smoke only. |
| Advisors re-run; remaining notices recorded, not broadened | **DONE** | See below. Pre-deploy baseline. |

### 2. API / Postgres logs — pre-deploy baseline (last ~24h)

Captured via Supabase MCP `get_logs` (`api`, `postgres`) on 2026-07-14.

**API — notable `POST /rest/v1/projects` failures still in window (pre-app-fix deploy):**

| Approx. UTC | Method | Path | Status |
| --- | --- | --- | --- |
| 2026-07-14 05:47:31Z | POST | `/rest/v1/projects` | **400** |
| 2026-07-14 04:13:50Z | POST | `/rest/v1/projects` | **400** |

No `POST /rest/v1/projects` **500** observed in the returned API log sample. Successful traffic otherwise dominated by authenticated GETs (projects/users/profiles) for `auth_user_id=5d29d9e3-…` / app user id `13`.

**Postgres ERROR rows in sample (100 recent lines):**

| Approx. UTC | Message |
| --- | --- |
| 2026-07-14 05:47:31Z | `new row for relation "projects" violates check constraint "projects_expected_member_count_positive_check"` |
| 2026-07-14 04:13:51Z | `new row for relation "projects" violates check constraint "projects_expected_member_count_positive_check"` |
| 2026-07-14 03:32:16Z | `relation "public.project_members" does not exist` (unrelated to this repair — do not broaden) |

**Interpretation:** These `projects_expected_member_count_positive_check` + POST 400 pairs are the **known pre-fix failure mode** (likely `expected_member_count = 0` or invalid empty mapping). They remain visible in the 24h window and **do not** prove the branch fix works in production until after app deploy + a clean smoke create.

### 3. Supabase advisors summary (MCP `get_advisors`)

Re-run on project `cwbmfnenunqzwwypqipc`. **Do not broaden this repair** to clear these; record only.

#### Security — 14 WARN

| Count | Lint | Notable targets |
| --- | --- | --- |
| 6 | `anon_security_definer_function_executable` | `applicant_withdraw_application`, `current_app_user_id`, `get_matched_contact_details`, `owner_decide_application`, `receiver_decide_proposal`, `sender_cancel_proposal` |
| 7 | `authenticated_security_definer_function_executable` | Same set + `get_matching_eligibility` |
| 1 | `auth_leaked_password_protection` | Auth leaked-password protection disabled |

Remediation refs: [lint 0028](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [lint 0029](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

#### Performance — 7 notices (3 WARN + 4 INFO)

| Level | Count | Lint | Notable |
| --- | --- | --- | --- |
| WARN | 1 | `auth_rls_initplan` | `public.users` / `users_select_self` |
| WARN | 2 | `multiple_permissive_policies` | `applications` SELECT; `proposals` SELECT (authenticated) |
| INFO | 4 | `unused_index` | `proposals_*` indexes (project/sender/receiver/status) |

Remediation refs: [lint 0003](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan), [lint 0005](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), [lint 0006](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies).

**None of these advisors are caused by or fixed by the project-deadline / create-500 app change.** Treat as backlog.

---

## What remains for post-deploy smoke (human checklist)

1. **Deploy app only** from `fix/project-deadline-and-create-500` (or merged main) via the normal Vercel/production path. Confirm deploy SHA includes mapping that omits / nulls empty `expected_member_count` and writes `recruitment_deadline` (not only `end_date`).
2. **Do not** run schema push / migrations.
3. As an **authenticated test user**, create a project with:
   - future recruitment deadline
   - **no** expected member count (leave blank / omit)
4. Assert:
   - HTTP **201**
   - DB/API row: `expected_member_count IS NULL`
   - `recruitment_deadline` equals submitted date
   - `end_date` null unless schedule end was supplied
5. Confirm project appears in **list / detail / mine** with the same deadline.
6. Deadline eligibility:
   - **Yesterday** deadline → hidden/blocked for non-owners; application + proposal creation rejected
   - **Today** deadline → still eligible
7. Re-read Supabase **API + Postgres** logs after smoke:
   - No **new** `projects_expected_member_count_positive_check` for the valid smoke create
   - No POST **400/500** for that valid create
8. Optionally re-run `get_advisors` (security + performance); expect same remaining notices as above — do not expand scope.

---

## Merge readiness

| Gate | Verdict |
| --- | --- |
| Schema push needed? | **No** |
| Remote advisors reviewed? | **Yes** (remaining notices documented; out of scope) |
| Logs baseline recorded? | **Yes** (pre-deploy; old 400 + check violations still in 24h window) |
| Production smoke? | **Not done — BLOCKED** |
| **GO / NO-GO for merge pending smoke** | **NO-GO** until deploy + authenticated create smoke (items 1–7) pass |

After smoke passes, flip to **GO** and attach smoke evidence (request ids / timestamps / project id) to the PR or this handoff.
