+# Week 3 API Without Migrations Execution Plan

> Scope guard: do not create or alter migration SQL, do not run a remote Supabase mutation, and do not edit UI component/page/form files.

## 1. Extend the shared email allowlist
- Files:
  - `frontend/src/features/auth/lib/school-email.test.mjs`
  - `frontend/src/features/auth/lib/school-email.ts`
- Add failing tests for `@naver.com` and `@gmail.com`.
- Keep both existing KMU domains accepted.
- Update the message to list all accepted domains.
- Verify with `node --test src/features/auth/lib/school-email.test.mjs`.

## 2. Add reusable project date and availability guards
- Files:
  - `frontend/src/features/projects/server/projects.guards.ts` (new)
  - `frontend/src/features/projects/server/projects.guards.test.mjs` (new)
  - `frontend/src/features/projects/server/projects.ts`
- Add pure guards for:
  - an optional valid start date and a required valid recruitment end date
  - start date not after the recruitment end date
  - recruitment end date not in the past for create/update
  - project accepting new participants only when `RECRUITING` and the end date is today or later
- Keep existing column names (`start_date`, `end_date`) and do not introduce `project_status` or `recruitment_deadline`.
- Verify the test fails before implementation, then passes.

## 3. Apply availability guard to applications, proposals, and recommendations
- Files:
  - `frontend/src/features/applications/server/applications.guards.ts`
  - `frontend/src/features/proposals/server/proposals.guards.ts`
  - `frontend/src/features/recommendations/server/recommendations.ts`
  - focused existing tests plus guard tests
- Extend project summaries to include `end_date`.
- Block new applications/proposals when the deadline is before today.
- Exclude closed/expired projects from project recommendations.
- Keep existing support for handling already-created applications after recruiting ends.
- Verify with focused Node tests.

## 4. Add received-applications server API
- Files:
  - `frontend/src/features/applications/server/applications.repository.ts`
  - `frontend/src/features/applications/server/applications.ts`
  - `frontend/src/app/api/applications/received/route.ts` (new)
  - `frontend/src/features/applications/server/applications.received.test.mjs` (new)
- Query applications for projects owned by the current user, newest first, while returning applicant and project basics.
- Authorize through the server session; do not accept a user ID from the request.
- Return 401 without a session and 403/404 only through existing common API errors as appropriate.
- Unit-test mapping/ownership guard behavior without connecting to the remote DB.

## 5. Harden error output and verify the repository scope
- File:
  - `frontend/src/lib/api/response.ts`
- Remove raw `console.error` output and preserve the existing safe generic 500 response.
- Run:
  - focused Node tests
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `git diff --check`
  - `rg -n "console\\.(log|error|warn|debug)"` over changed application source
  - `git status --short`
- Confirm no `supabase/migrations` file or UI component/page/form changed.
