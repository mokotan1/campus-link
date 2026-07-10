# Supabase MVP Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Supabase Cloud and Next.js the only runnable MVP architecture, with database-enforced authorization and a maintainable server-first data-access boundary for the P0 Campus Link flow.

**Architecture:** The authoritative runtime is the Next.js application in `frontend/`, connected to Supabase Auth and Supabase Postgres. Route Handlers obtain the authenticated user from the request session and call small feature repositories; PostgreSQL RLS remains the final authorization boundary. The existing Spring Boot/Flyway code is preserved only as explicitly non-runnable Phase 2 reference material.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `@supabase/ssr`, `@supabase/supabase-js`, Supabase SQL migrations, ESLint, TypeScript compiler.

## Global Constraints

- The top-level Campus Link PRD is authoritative: MVP is Next.js + Supabase; Spring Boot is out of MVP scope.
- Preserve the existing Supabase bigint application IDs and `text[]` tags during this refactor. Do not undertake UUID/normalization conversion.
- Use Supabase Auth session identity as the authority; never accept a user ID supplied by the browser as proof of ownership.
- Every public table must have RLS enabled and default-deny until its explicit policies are added.
- P0 includes onboarding, portfolio link, project list/detail/create, application/proposal state changes, and contact disclosure after acceptance. Recommendation remains P1.
- User-visible API failures use the Notion error-code contract; database and stack details are server-only.
- Preserve existing user worktree changes. Do not use destructive Git commands or rewrite prior migrations.

## Authoritative References

- [Campus Link PRD](https://app.notion.com/p/38aea40d267881ae97f2d8c3751e4d3f)
- [Screen/API contract](https://app.notion.com/p/38eea40d2678813dafdcc0bb5e7f95b9)
- [Validation and error codes](https://app.notion.com/p/38eea40d2678811696f8cb35a15d5f15)
- [Recommendation specification](https://app.notion.com/p/38eea40d26788190aa60fc656c34f677)

---

## Planned File Map

| Path | Responsibility |
| --- | --- |
| `docker-compose.yml` | Optional frontend-only local container runtime; no application database or Spring service. |
| `README.md`, `frontend/README.md`, `docs/development-setup.md`, `docs/docker-development.md` | One supported Supabase Cloud setup and Phase 2 boundary. |
| `backend/README.md`, `backend/PHASE_2_NOT_IN_MVP.md` | Clearly label the dormant backend and its Flyway schema as non-authoritative. |
| `frontend/supabase/migrations/202607100001_*` | Auth bridge completion, proposals/contact disclosure, constraints and RLS policies. |
| `frontend/src/lib/api/error.ts`, `response.ts` | Typed application error and safe error response formatting. |
| `frontend/src/lib/supabase/database.types.ts` | Generated Supabase database types (generated, not handwritten). |
| `frontend/src/features/*/server/*.repository.ts` | One thin data-access module per feature. |
| `frontend/src/features/*/server/*.ts` | Validation, authorization, state transitions, and DTO mapping. |
| `frontend/src/shared/lib/app-data-context.tsx` | Transitional UI-only state or removal after page consumers are migrated; no global initial API loading. |
| `frontend/src/app/{projects,applications}/**` | Server-first page reads plus narrowly scoped interactive client children. |

---

### Task 1: Establish one runnable MVP architecture

**Files:**
- Modify: `docker-compose.yml`, `README.md`, `frontend/README.md`, `docs/development-setup.md`, `docs/docker-development.md`
- Create: `backend/PHASE_2_NOT_IN_MVP.md`
- Modify: `backend/README.md`

**Produces:** A developer can run only the Next.js frontend with Supabase Cloud credentials; no documentation says the local Spring/Flyway/Postgres stack is the MVP source of truth.

- [ ] **Step 1: Document the architecture decision record.**

  Add a concise, identical statement to root and backend documentation:

  ```md
  ## MVP runtime boundary

  The current MVP runs as `frontend/` (Next.js) against Supabase Auth and Supabase Postgres.
  `frontend/supabase/migrations/` is the only authoritative MVP schema history.
  `backend/` and its Flyway migrations are retained only for Phase 2 evaluation and are not run by Docker Compose or CI.
  ```

- [ ] **Step 2: Make Compose frontend-only.**

  Replace the service graph with the single `frontend` service, remove `depends_on`, remove `NEXT_PUBLIC_API_BASE_URL`, and pass only the public Supabase URL/key at runtime. Do not put the service-role key in a browser-visible `NEXT_PUBLIC_*` variable.

- [ ] **Step 3: Verify supported startup instructions.**

  Run: `docker compose config`

  Expected: configuration contains only `frontend`; no `backend` or `db` service.

- [ ] **Step 4: Commit.**

  ```bash
  git add docker-compose.yml README.md frontend/README.md docs/development-setup.md docs/docker-development.md backend/README.md backend/PHASE_2_NOT_IN_MVP.md
  git commit -m "docs: define Supabase as MVP source of truth"
  ```

### Task 2: Make the Auth-to-app-user relationship explicit

**Files:**
- Modify: `frontend/supabase/migrations/202607060001_auth_user_bridge.sql`
- Create: `frontend/supabase/migrations/202607100001_auth_identity_and_mvp_constraints.sql`
- Modify: `frontend/src/features/auth/server/bootstrap-user.ts`, `frontend/src/features/auth/server/current-app-user.ts`
- Test: `frontend/src/features/auth/server/current-app-user.test.mjs`

**Produces:** A single documented mapping from `auth.uid()` to the existing bigint `public.users.id`; every repository can resolve the caller without trusting request payload ownership fields.

- [ ] **Step 1: Write a failing identity mapping test.**

  ```js
  import test from "node:test";
  import assert from "node:assert/strict";
  import { toAppUser } from "./current-app-user.ts";

  test("toAppUser rejects an app user that is not linked to the auth subject", () => {
    assert.throws(() => toAppUser({ id: 1, auth_user_id: null }), /UNAUTHORIZED/);
  });
  ```

- [ ] **Step 2: Add the non-destructive migration.**

  The migration must add/verify `public.users.auth_user_id uuid unique references auth.users(id) on delete cascade`, backfill only when a matching email can be proven, and create a `current_app_user_id()` `security definer` helper returning the bigint user ID for `auth.uid()`. It must fail safely for unmatched legacy rows rather than guessing a link.

- [ ] **Step 3: Make `getCurrentAppUser()` use the authenticated server client.**

  Its contract is:

  ```ts
  export type CurrentAppUser = { id: number; authUserId: string; email: string };
  export async function getCurrentAppUser(): Promise<CurrentAppUser | null>;
  ```

  It reads the Supabase session first, then resolves only the matching app user. The service-role client is not used for identity lookup.

- [ ] **Step 4: Run focused checks.**

  Run: `node --test src/features/auth/server/current-app-user.test.mjs`

  Expected: PASS.

- [ ] **Step 5: Commit.**

  ```bash
  git add frontend/supabase/migrations frontend/src/features/auth/server
  git commit -m "feat: bind app users to Supabase Auth subjects"
  ```

### Task 3: Add RLS default-deny and P0 ownership policies

**Files:**
- Create: `frontend/supabase/migrations/202607100002_rls_p0_policies.sql`
- Create: `frontend/supabase/tests/rls-p0.sql`
- Modify: `docs/SECURITY_GUIDELINES.md`

**Produces:** Database-enforced access control for `users`, `profiles`, `portfolio_items`, `projects`, and `applications`; policy coverage is executable with two authenticated test subjects.

- [ ] **Step 1: Write the RLS verification script before policies.**

  Cover these assertions: owner can read/update own profile; another user cannot; anyone authenticated can list recruiting projects; only owner can update a project; applicant can create/read own application; project owner can read and transition its applications; third party can do neither.

- [ ] **Step 2: Enable RLS on every existing public app table.**

  ```sql
  alter table public.users enable row level security;
  alter table public.profiles enable row level security;
  alter table public.portfolio_items enable row level security;
  alter table public.projects enable row level security;
  alter table public.applications enable row level security;
  ```

  Do not create permissive `using (true)` policies. Add explicit policies using `current_app_user_id()` and `exists` ownership checks.

- [ ] **Step 3: Add authorization-safe data constraints.**

  Ensure application uniqueness already exists, and add checks that state values are valid. Use a SQL function for owner-only application transitions if PostgREST policy expressions cannot safely distinguish accepted/rejected mutation intent.

- [ ] **Step 4: Execute the migration against a disposable Supabase project and run RLS checks.**

  Run: `supabase db push && psql "$SUPABASE_DB_URL" -f supabase/tests/rls-p0.sql`

  Expected: allowed operations succeed; every forbidden operation fails with an RLS/permission error.

- [ ] **Step 5: Commit.**

  ```bash
  git add frontend/supabase docs/SECURITY_GUIDELINES.md
  git commit -m "feat: enforce P0 ownership with RLS"
  ```

### Task 4: Introduce typed, safe API errors

**Files:**
- Create: `frontend/src/lib/api/error.ts`, `frontend/src/lib/api/error.test.mjs`
- Modify: `frontend/src/lib/api/response.ts`
- Modify: all files under `frontend/src/app/api/**/route.ts`

**Produces:** The API contract is `{ success: false, error: { code, message, fields? } }`; no status is inferred from Korean message text and unknown database failures are opaque.

- [ ] **Step 1: Write failing tests for deliberate and unknown errors.**

  ```js
  test("returns a declared forbidden error", async () => {
    const response = apiErrorFromUnknown(new AppError("FORBIDDEN", "접근 권한이 없습니다."));
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { success: false, error: { code: "FORBIDDEN", message: "접근 권한이 없습니다." } });
  });

  test("hides an unknown database error", async () => {
    const response = apiErrorFromUnknown(new Error('relation "users" does not exist'));
    assert.equal(response.status, 500);
    assert.equal((await response.json()).error.code, "INTERNAL_ERROR");
  });
  ```

- [ ] **Step 2: Implement `AppError`.**

  ```ts
  export class AppError extends Error {
    constructor(
      public readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "DUPLICATE_RESOURCE" | "INVALID_STATE_TRANSITION" | "RATE_LIMITED" | "INTERNAL_ERROR",
      message: string,
      public readonly fields?: Array<{ field: string; message: string }>,
    ) { super(message); }
    get status() { return ({ UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, VALIDATION_ERROR: 400, DUPLICATE_RESOURCE: 409, INVALID_STATE_TRANSITION: 409, RATE_LIMITED: 429, INTERNAL_ERROR: 500 } as const)[this.code]; }
  }
  ```

- [ ] **Step 3: Delete `inferErrorStatus`; convert route handlers and feature services.**

  Validation throws `VALIDATION_ERROR`; missing session throws `UNAUTHORIZED`; ownership failure throws `FORBIDDEN`; duplicate/state failures throw their named 409 code. Log unknown errors without secrets and return only `INTERNAL_ERROR` / `"요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요."`.

- [ ] **Step 4: Run checks.**

  Run: `node --test src/lib/api/error.test.mjs && npm run typecheck && npm run lint`

  Expected: all pass; `rg "inferErrorStatus" src` returns no matches.

- [ ] **Step 5: Commit.**

  ```bash
  git add frontend/src/lib/api frontend/src/app/api frontend/src/features
  git commit -m "refactor: use explicit API errors"
  ```

### Task 5: Generate database types and add feature repositories

**Files:**
- Create: `frontend/src/lib/supabase/database.types.ts`
- Create: `frontend/src/features/{profile,projects,portfolios,applications}/server/*.repository.ts`
- Modify: existing files in those feature `server/` folders and `frontend/src/lib/supabase/{admin,server}.ts`

**Produces:** Schema-generated Supabase typing, column constants, and focused repositories replace repeated service-role setup, select strings, and `as *Row` casts.

- [ ] **Step 1: Generate types from the authoritative schema.**

  Run: `supabase gen types typescript --project-id "$SUPABASE_PROJECT_REF" --schema public > src/lib/supabase/database.types.ts`

  Expected: generated file exports `Database`; no manual schema duplicate is introduced.

- [ ] **Step 2: Add repository contracts.**

  ```ts
  export interface ProjectRepository {
    list(filters: ProjectListFilters): Promise<ProjectRecord[]>;
    findById(id: number): Promise<ProjectRecord | null>;
    create(ownerUserId: number, values: ProjectFormValues): Promise<ProjectRecord>;
  }
  ```

  Define equivalent narrow interfaces for profile, portfolio, application, and proposal. Each repository owns its `select` constant and maps `Database["public"]["Tables"]` rows to DTOs.

- [ ] **Step 3: Separate privileged maintenance operations.**

  Regular request data access uses the session-bound server client so RLS executes. `createAdminClient()` is permitted only in an explicitly named bootstrap/maintenance module; document every remaining use with its reason.

- [ ] **Step 4: Remove unsafe casts and verify.**

  Run: `rg "as [A-Za-z]+Row|createAdminClient\(\)" src/features src/app/api`

  Expected: no row casts; only documented bootstrap/maintenance service-role usage remains.

- [ ] **Step 5: Commit.**

  ```bash
  git add frontend/src/lib/supabase frontend/src/features
  git commit -m "refactor: isolate typed Supabase repositories"
  ```

### Task 6: Complete applications, proposals, and contact disclosure

**Files:**
- Create: `frontend/supabase/migrations/202607100003_proposals_and_contact_disclosure.sql`
- Create: `frontend/src/features/proposals/server/{proposals.repository.ts,proposals.ts}`
- Create: `frontend/src/app/api/proposals/{route.ts,received/route.ts,sent/route.ts,[proposalId]/accept/route.ts,[proposalId]/reject/route.ts}`
- Modify: `frontend/src/features/applications/server/applications.ts` and API routes
- Create: focused `*.test.mjs` files for application/proposal state transitions

**Produces:** The P0 matching flow has real proposal records, owner/recipient-controlled transitions, and a minimal contact-detail read model visible only after acceptance.

- [ ] **Step 1: Write state-transition tests.**

  Include: cannot apply to own project, duplicate application returns `DUPLICATE_RESOURCE`, only project owner accepts/rejects application, only proposal receiver accepts/rejects proposal, and a pending/denied pair cannot read contact details.

- [ ] **Step 2: Add migration and RLS.**

  Create `proposals` with bigint foreign keys, sender/receiver uniqueness appropriate to the MVP, `PENDING|ACCEPTED|REJECTED|CANCELLED` status check, timestamps, and policies for project owners/senders/receivers. Add a `matched_contact_details` view or RPC that returns the minimum approved contact fields only when an accepted application/proposal relates the two current users.

- [ ] **Step 3: Implement named use cases.**

  ```ts
  createApplication(currentUser, input)
  withdrawApplication(currentUser, applicationId)
  decideApplication(currentUser, applicationId, "ACCEPTED" | "REJECTED")
  createProposal(currentUser, input)
  decideProposal(currentUser, proposalId, "ACCEPTED" | "REJECTED")
  ```

  Each performs server validation first, then relies on RLS as the second barrier.

- [ ] **Step 4: Verify P0 flow with two accounts.**

  Run the focused test suite, then manually perform application → accepted → mutual contact disclosure and proposal → accepted → mutual contact disclosure.

- [ ] **Step 5: Commit.**

  ```bash
  git add frontend/supabase frontend/src/features frontend/src/app/api
  git commit -m "feat: complete secure application and proposal flow"
  ```

### Task 7: Move page reads to Server Components and dismantle the god context

**Files:**
- Modify: `frontend/src/app/layout.tsx`, `frontend/src/shared/lib/app-data-context.tsx`
- Modify: `frontend/src/app/projects/page.tsx`, `frontend/src/app/projects/[id]/page.tsx`, `frontend/src/app/applications/page.tsx`
- Create: small client children under `frontend/src/features/{projects,applications}/components/`
- Modify: `frontend/src/app/onboarding/page.tsx`

**Produces:** Initial project/detail/application reads occur on the server without three global client fetches; interaction remains in focused client components and onboarding no longer owns unrelated global state.

- [ ] **Step 1: Write a rendering contract test or manual route checklist.**

  For `/projects`, `/projects/:id`, and `/applications`, verify loading, empty, error, unauthorized, and forbidden states named in the API specification.

- [ ] **Step 2: Convert list/detail/application pages.**

  ```tsx
  export default async function ProjectsPage() {
    const projects = await listProjects({ query: "", campus: "", role: "", status: "" });
    return <ProjectsScreen initialProjects={projects} />;
  }
  ```

  Keep search controls and submit buttons client-side; never move `createAdminClient()` into a page.

- [ ] **Step 3: Split onboarding by responsibility.**

  Extract step components and one `saveOnboardingStep(step, values)` server/API boundary. Preserve the PRD rule: basic info, roles/tools, and collaboration state are required; portfolio link is skippable; unfinished onboarding resumes from the first incomplete required step.

- [ ] **Step 4: Remove global initial-fetch effects.**

  `AppDataProvider` must not call `/api/projects`, `/api/portfolios`, and `/api/applications/me` on every mount. Delete it from `layout.tsx` once all consumers are migrated; retain only local UI state where necessary.

- [ ] **Step 5: Verify.**

  Run: `npm run typecheck && npm run lint && npm run build`

  Expected: pass; browser network inspection shows no global three-request waterfall on initial page navigation.

- [ ] **Step 6: Commit.**

  ```bash
  git add frontend/src/app frontend/src/features frontend/src/shared/lib
  git commit -m "refactor: render P0 reads on the server"
  ```

### Task 8: Finish P0 regression and add P1 recommendation safely

**Files:**
- Create: `frontend/src/features/recommendations/server/{recommendations.repository.ts,recommendations.ts,recommendations.test.mjs}`
- Create: `frontend/src/app/api/recommendations/projects/route.ts`, `frontend/src/app/api/recommendations/profiles/route.ts`
- Modify: dashboard/project components only after P0 tests pass
- Create: `docs/qa-refactoring-p0.md`

**Produces:** A testable P0 regression checklist and optional rule-based recommendations that do not alter authorization or the P0 matching flow.

- [ ] **Step 1: Run the P0 regression before recommendation work.**

  Execute the two-user scenario from the PRD: school login, onboarding resume, portfolio link, create/filter project, apply, owner accepts, recipient sees contact details. Record results in `docs/qa-refactoring-p0.md`.

- [ ] **Step 2: Write scoring tests.**

  ```js
  test("sorts project recommendations by score then role score then recency", () => {
    assert.deepEqual(rankProjects(profile, projects).map(({ id }) => id), [12, 7, 3]);
  });
  ```

- [ ] **Step 3: Implement only the approved rule-based score.**

  Project recommendations: role 40, tool/tag 25, campus 15, recruiting 10, deadline 5, profile readiness 5. Profile recommendations: role 40, tool/tag 25, campus 15, availability 10, public portfolio 10. Return stable sort and reason codes; exclude own and already-applied projects.

- [ ] **Step 4: Verify all release gates.**

  Run: `npm run typecheck && npm run lint && npm run build && node --test src/**/*.test.mjs`

  Expected: all commands pass. Confirm RLS checks still pass after all migrations.

- [ ] **Step 5: Commit.**

  ```bash
  git add frontend/src docs/qa-refactoring-p0.md
  git commit -m "feat: add explainable MVP recommendations"
  ```

## Release Gate

Release only when all of the following are demonstrated with two non-admin accounts:

1. No local backend/Postgres is required to run the app.
2. RLS blocks cross-user read and mutation attempts for every public app table.
3. API errors follow the specified code/status contract and do not expose Supabase/Postgres details.
4. The P0 application and proposal acceptance paths disclose contact details only after acceptance.
5. Project, detail, and applications pages load without the former provider waterfall.
6. `npm run typecheck`, `npm run lint`, `npm run build`, focused Node tests, and Supabase RLS SQL tests pass.

## Deliberately Deferred to Phase 2

- Spring Boot implementation or Flyway schema migration.
- UUID primary-key conversion and tag-table normalization.
- File uploads, Storage, chat, push notifications, ratings, or admin UI.
- ML/personalized recommendation, external-link crawling, and rate limiting infrastructure beyond provider defaults.
