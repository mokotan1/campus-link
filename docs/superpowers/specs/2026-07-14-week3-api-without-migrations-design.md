# Week 3 API Without Migrations Design

## Goal

Complete the server-side Week 3 behaviors that do not require a Supabase schema or RLS migration, while allowing `kmu.ac.kr`, `naver.com`, and `gmail.com` email accounts.

## Scope

- Add received-applications lookup for projects owned by the logged-in user.
- Complete project create/update request validation for dates, ownership, and independent recruitment/project statuses where the existing schema supports them.
- Keep deadline checks in application, proposal, and recommendation server logic.
- Make recommendation ranking deterministic and exclude the current user, unavailable users, incomplete onboarding users, and already-proposed users.
- Refresh the committed Supabase TypeScript types only from the schema already represented in `origin/main`; no remote schema command is run.
- Extend the server-side email allowlist to `kmu.ac.kr`, `naver.com`, and `gmail.com`.

## Explicitly Excluded

- No Supabase remote database changes.
- No migration SQL files, including `project_status`, `recruitment_deadline`, constraints, indexes, or RLS changes.
- No UI component, badge, input-form, page, or browser-console changes.
- No proposal cancellation, acceptance, or rejection changes because `origin/main` already owns those APIs.

## Architecture

Route handlers remain thin and call feature server modules. Feature server modules validate authenticated ownership and domain rules before repositories use Supabase. Shared email-domain logic remains in `features/auth/lib/school-email.ts` so the client-side auth panel and server bootstrap route use the same policy.

The work must be safe against the current remote database lag: code will not depend on un-applied columns such as `project_status` or `recruitment_deadline`. Migration-dependent behavior is documented as blocked until the team applies its approved migrations.

## Error Handling And Testing

- Use existing common API error responses; do not log token, email, or database details.
- Add or extend Node tests for pure validation, ownership guard decisions, recommendation ordering, and email domains.
- Run typecheck, lint, and build after the focused test suite.

## Success Criteria

- A logged-in project owner can retrieve received applications; a non-owner cannot.
- Project dates are rejected when missing, past, or ordered incorrectly.
- Recommendation output is deterministic and excludes ineligible profiles.
- `naver.com` and `gmail.com` are accepted anywhere `isSchoolEmail` is used.
- The branch contains no migration SQL and no UI file changes.
