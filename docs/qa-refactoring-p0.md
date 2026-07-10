# P0 Regression Checklist — Supabase MVP Refactoring

> Branch: `refactor/supabase-mvp`  
> Recorded: 2026-07-10  
> Scope: Two-user P0 flow from the Campus Link PRD (school login → onboarding → portfolio → project create/filter → apply → owner accept → contact disclosure).

## Summary

| Area | Automated coverage | Live two-account UI |
| --- | --- | --- |
| Auth & onboarding | Partial (unit tests) | **BLOCKED** |
| Portfolio link | None (API exists) | **BLOCKED** |
| Project list/create/filter | Partial (page-state unit test) | **BLOCKED** |
| Application flow | **PASS** (guard unit tests + RLS SQL) | **BLOCKED** |
| Contact disclosure | **PASS** (guard unit test + RLS SQL) | **BLOCKED** |
| Recommendations (P1) | **PASS** (scoring unit tests) | Not in P0 scope |

**Explicit note:** Live two-account verification is **pending migration push** to the target Supabase Cloud project and availability of two confirmed school-email test accounts. Automated checks below are based on existing unit tests and `frontend/supabase/tests/rls-p0.sql`.

---

## P0 Scenario Steps

### 1. School email login

| Field | Value |
| --- | --- |
| Status | **BLOCKED** |
| Reason | Live Supabase session with confirmed `@kmu.ac.kr` account not exercised in this run; migrations may not be applied on remote project yet. |
| Automated coverage | `src/features/auth/lib/school-email.test.mjs`, `src/features/auth/server/current-app-user.test.mjs`, `src/features/auth/server/auth-session-error.test.mjs` |

### 2. Onboarding resume (5 steps, profile persistence)

| Field | Value |
| --- | --- |
| Status | **BLOCKED** |
| Reason | Requires live authenticated session + applied onboarding migrations (`202607080001_onboarding_profile_fields.sql`). |
| Automated coverage | Manual checklist in `docs/qa-auth-onboarding.md`; no dedicated onboarding unit test in this branch. |

### 3. Portfolio external link (step 3, no file upload)

| Field | Value |
| --- | --- |
| Status | **BLOCKED** |
| Reason | Requires live `POST /api/portfolios` against migrated schema. |
| Automated coverage | None (repository/API implemented; no unit test). |

### 4. Create and filter projects

| Field | Value |
| --- | --- |
| Status | **BLOCKED** (live UI) / **PASS** (server read path) |
| Reason | Live UI blocked as above; server-first project pages and list API are implemented on this branch. |
| Automated coverage | `src/features/projects/lib/page-states.test.mjs`; project repository + `GET/POST` routes (no dedicated integration test). |

### 5. Applicant applies to recruiting project

| Field | Value |
| --- | --- |
| Status | **PASS** (automated guards) / **BLOCKED** (live UI) |
| Reason | Guard rules verified in unit tests; live apply flow not run without second account. |
| Automated coverage | `src/features/applications/server/applications.transitions.test.mjs`, `frontend/supabase/tests/rls-p0.sql` (applicant create/read own) |

### 6. Project owner accepts application

| Field | Value |
| --- | --- |
| Status | **PASS** (automated) / **BLOCKED** (live UI) |
| Reason | `owner_decide_application` RPC and owner-only RLS verified in SQL test. |
| Automated coverage | `src/features/applications/server/applications.transitions.test.mjs`, `frontend/supabase/tests/rls-p0.sql` (owner read + ACCEPTED transition) |

### 7. Accepted recipient sees contact details

| Field | Value |
| --- | --- |
| Status | **PASS** (automated) / **BLOCKED** (live UI) |
| Reason | Contact disclosure guard and `get_matched_contact_details` RPC authorization verified; live UI not exercised. |
| Automated coverage | `src/features/matching/server/contact-disclosure.test.mjs`, `frontend/supabase/tests/rls-p0.sql` (matched contact RPC) |

---

## Release Gate Commands (this task)

Run from `frontend/`:

```powershell
npm run typecheck
npm run lint
npm run build
Get-ChildItem -Path src -Recurse -Filter *.test.mjs | ForEach-Object { node --test $_.FullName }
```

Expected: all commands pass before recommendation commit.

---

## P1 Add-on (this task)

| Item | Status |
| --- | --- |
| Rule-based project recommendations (`GET /api/recommendations/projects`) | Implemented |
| Rule-based profile recommendations (`GET /api/recommendations/profiles?projectId=`) | Implemented |
| Scoring unit tests (`recommendations.test.mjs`) | **PASS** |
| Authorization unchanged | Recommendations are read-only; session-bound client only; profile route requires project ownership |
| P0 matching flow unchanged | No changes to application/proposal guards or contact disclosure |

---

## Pending Before Production Sign-off

1. Push and apply all migrations under `frontend/supabase/migrations/` to Supabase Cloud.
2. Run `frontend/supabase/tests/rls-p0.sql` against the migrated database.
3. Execute this checklist live with two non-admin `@kmu.ac.kr` accounts.
4. Mark each BLOCKED row PASS or FAIL with tester name and date.
