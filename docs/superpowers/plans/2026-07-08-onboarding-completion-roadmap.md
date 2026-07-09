# Onboarding Completion Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Campus Link onboarding feature according to the PRD by storing onboarding data structurally, enforcing school email rules, preventing duplicate portfolio records, supporting resume-after-exit, and moving client API calls out of page components.

**Architecture:** Implement one vertical slice at a time. Keep existing Supabase Route Handlers and server feature modules, but add small, typed client API adapters under feature folders before changing UI behavior. Add database columns through Supabase migrations before relying on them in TypeScript code.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, Supabase PostgreSQL, Next.js Route Handlers.

## Global Constraints

- 인증은 Supabase Auth를 사용한다.
- 로그인 세션은 Supabase가 발급한 세션을 기준으로 확인한다.
- 서버에서 사용자 권한을 확인할 때는 클라이언트가 보낸 사용자 ID를 신뢰하지 않고 Supabase 세션의 사용자 ID를 기준으로 판단한다.
- 사용자는 본인 프로필, 본인 지원 내역, 본인이 등록한 프로젝트만 수정할 수 있어야 한다.
- MVP에서는 파일 업로드를 제외하고 외부 포트폴리오 링크만 저장한다.
- 클라이언트 validation은 UX 보조 수단으로만 사용하고, 최종 검증은 서버 로직과 데이터베이스 정책에서 수행한다.
- API 연결 코드는 feature별 API 모듈에 두고 page 파일에 직접 fetch 로직을 몰아넣지 않는다.
- 학교 이메일 인증을 통해 외부 사용자의 무분별한 가입을 제한한다.

---

## Current State

**Branch:** `codex/fend-api-integration`

**Latest stabilization commit:** `c1a3f03 인증 온보딩 안정화 작업 정리`

**Already working:**
- `/auth` renders `AuthPanel`.
- Supabase sign-up/sign-in/sign-out works through the client SDK.
- `/api/auth/bootstrap` derives the authenticated user server-side.
- `/onboarding` is gated by Supabase session state.
- Final onboarding save updates `/api/profiles/me`.
- Existing `studentId` is preserved during onboarding save.
- External portfolio link can be saved through `/api/portfolios`.
- `npm.cmd run typecheck` passes.
- `npm.cmd run lint` passes.

**Not complete yet:**
- Onboarding fields are not fully stored as structured database fields.
- School email domain/verification policy is not enforced.
- Portfolio duplicate prevention is not implemented.
- Profile readiness badge/condition is not calculated.
- Onboarding resume-after-exit is not implemented.
- `frontend/src/app/onboarding/page.tsx` still owns direct fetch/Supabase orchestration.

## Cursor Composer 2 Execution Rule

Execute tasks in order. Do not skip Task 1 because later tasks depend on the database/API shape. Keep each task independently testable and commit after each task.

At the end of each task, run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Commit messages may be Korean or English, but keep them specific.

---

## Task 1: Store Onboarding Profile Data Structurally

**Goal:** Store the onboarding fields as queryable profile/user fields instead of folding them into `bio`.

**Files:**
- Create: `frontend/supabase/migrations/20260708_onboarding_profile_fields.sql`
- Modify: `frontend/src/features/profile/server/profile-me.ts`
- Modify: `frontend/src/app/api/profiles/me/route.ts`
- Modify: `frontend/src/app/onboarding/page.tsx`

**Database fields to add:**
- `public.users.campus varchar(100)`
- `public.profiles.display_name varchar(80)`
- `public.profiles.role_tags text[] not null default '{}'`
- `public.profiles.availability_status varchar(40)`
- `public.profiles.collaboration_type varchar(80)`
- `public.profiles.weekly_hours varchar(40)`
- `public.profiles.onboarding_completed boolean not null default false`

**Expected API shape after this task:**

```ts
export type ProfileFormValues = {
  displayName: string;
  campus: string;
  studentId: string;
  department: string;
  grade: string;
  bio: string;
  roleTags: string[];
  techStack: string;
  availabilityStatus: string;
  collaborationType: string;
  weeklyHours: string;
  collaborationStatus: "OPEN" | "CLOSED";
  onboardingCompleted: boolean;
};
```

- [ ] **Step 1: Add migration**

Create `frontend/supabase/migrations/20260708_onboarding_profile_fields.sql`:

```sql
alter table public.users
  add column if not exists campus varchar(100);

alter table public.profiles
  add column if not exists display_name varchar(80),
  add column if not exists role_tags text[] not null default '{}',
  add column if not exists availability_status varchar(40),
  add column if not exists collaboration_type varchar(80),
  add column if not exists weekly_hours varchar(40),
  add column if not exists onboarding_completed boolean not null default false;
```

- [ ] **Step 2: Extend profile server types and query**

Update `ProfileFormValues` and `ProfileRecord` in `frontend/src/features/profile/server/profile-me.ts` to include the fields listed above.

Update `getMyProfile()`:
- Select `display_name, student_id, department, grade, bio, role_tags, tech_stack, availability_status, collaboration_type, weekly_hours, collaboration_status, onboarding_completed` from `profiles`.
- Also include `appUser.email` and `appUser.campus`.

Update `updateMyProfile()`:
- Update `users.campus` when `values.campus` is present.
- Update the new `profiles` columns.
- Preserve existing fallback behavior for fields not provided by mapping missing values to empty strings or defaults.

- [ ] **Step 3: Extend route payload parser**

Update `parseProfilePayload()` in `frontend/src/app/api/profiles/me/route.ts`:
- Parse `displayName`, `campus`, `roleTags`, `availabilityStatus`, `collaborationType`, `weeklyHours`, `onboardingCompleted`.
- Convert `roleTags` to trimmed non-empty strings.
- Keep `collaborationStatus` normalization as `"CLOSED"` or `"OPEN"`.

- [ ] **Step 4: Update onboarding final save payload**

In `frontend/src/app/onboarding/page.tsx`, send structured fields:

```ts
{
  displayName: profile.name,
  campus: profile.campus,
  studentId: profilePayload.data.studentId,
  department: profile.department,
  grade: profile.grade,
  bio: "",
  roleTags: profile.roles,
  techStack: profile.tools,
  availabilityStatus: profile.availabilityStatus,
  collaborationType: profile.collaborationType,
  weeklyHours: profile.weeklyHours,
  collaborationStatus,
  onboardingCompleted: true,
}
```

Do not store `name`, `roles`, `collaborationType`, `weeklyHours`, or `availabilityStatus` by concatenating them into `bio`.

- [ ] **Step 5: Verify**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Expected:
- Both pass.

Commit:

```bash
git add frontend/supabase/migrations/20260708_onboarding_profile_fields.sql frontend/src/features/profile/server/profile-me.ts frontend/src/app/api/profiles/me/route.ts frontend/src/app/onboarding/page.tsx
git commit -m "온보딩 프로필 데이터 구조화 저장"
```

---

## Task 2: Enforce School Email Policy

**Goal:** Restrict onboarding/auth flow to school emails and expose verification state clearly.

**Files:**
- Create: `frontend/src/features/auth/lib/school-email.ts`
- Modify: `frontend/src/features/auth/components/auth-panel.tsx`
- Modify: `frontend/src/app/api/auth/bootstrap/route.ts`
- Modify: `frontend/src/features/auth/server/bootstrap-user.ts`
- Optional create: `frontend/supabase/migrations/20260708_school_email_verification.sql`

**Policy for MVP:**
- Allowed domains initially: `kmu.ac.kr`.
- Client shows validation before sign-up/sign-in attempts.
- Server rejects bootstrap for non-school email.
- If Supabase returns no session after sign-up, do not bootstrap until confirmed sign-in.

- [ ] **Step 1: Add shared email helper**

Create `frontend/src/features/auth/lib/school-email.ts`:

```ts
const allowedSchoolDomains = ["kmu.ac.kr"];

export function getEmailDomain(email: string) {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export function isSchoolEmail(email: string) {
  return allowedSchoolDomains.includes(getEmailDomain(email));
}

export function schoolEmailMessage() {
  return "학교 이메일 도메인(kmu.ac.kr)으로 가입해야 합니다.";
}
```

- [ ] **Step 2: Add client-side guard**

In `AuthPanel.handleSubmit()`:
- Before `signUp` or `signInWithPassword`, check `isSchoolEmail(email)`.
- If false, set error message from `schoolEmailMessage()` and return.

- [ ] **Step 3: Add server-side guard**

In `frontend/src/app/api/auth/bootstrap/route.ts`:
- Import `isSchoolEmail` and `schoolEmailMessage`.
- If `!isSchoolEmail(user.email)`, return a 400 error using `apiError`.

This keeps server enforcement independent of client validation.

- [ ] **Step 4: Add verification metadata if schema supports it**

If the Supabase `users` table has or can safely add a verification field, create a migration:

```sql
alter table public.users
  add column if not exists email_verified boolean not null default false;
```

Then in `bootstrapUser`, set `email_verified` based on whether the authenticated Supabase user has confirmed email metadata available from the route. If the current server helper does not expose this reliably, skip DB storage and leave a note in the final report.

- [ ] **Step 5: Verify**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Commit:

```bash
git add frontend/src/features/auth/lib/school-email.ts frontend/src/features/auth/components/auth-panel.tsx frontend/src/app/api/auth/bootstrap/route.ts frontend/src/features/auth/server/bootstrap-user.ts frontend/supabase/migrations/20260708_school_email_verification.sql
git commit -m "학교 이메일 검증 추가"
```

---

## Task 3: Prevent Duplicate Portfolio Records And Add Readiness Conditions

**Goal:** Make onboarding portfolio save idempotent enough for repeated onboarding completion and expose profile readiness conditions.

**Files:**
- Modify: `frontend/src/features/portfolios/server/portfolios.ts`
- Modify: `frontend/src/app/api/portfolios/route.ts`
- Modify: `frontend/src/features/profile/server/profile-me.ts`
- Modify: `frontend/src/app/onboarding/page.tsx`

**Behavior:**
- A user cannot create duplicate portfolio items with the same `externalUrl`.
- Profile record includes `readiness` conditions:
  - `hasSchoolEmail`
  - `hasBasicInfo`
  - `hasRoleTags`
  - `hasPortfolio`
  - `hasRoleInWork`
  - `hasAvailability`
  - `isReady`

- [ ] **Step 1: Add duplicate detection in portfolio server module**

In `createPortfolio(values)`:
- After `currentUser` is loaded and before insert, query:

```ts
const { data: existing, error: existingError } = await admin
  .from("portfolio_items")
  .select("id, user_id, title, description, external_url, role_in_work, tools, created_at")
  .eq("user_id", currentUser.id)
  .eq("external_url", values.externalUrl)
  .maybeSingle();
```

- If `existing` exists, update `title`, `description`, `role_in_work`, `tools` instead of inserting.

- [ ] **Step 2: Include readiness in profile response**

In `getMyProfile()`:
- Query whether at least one portfolio exists for the app user.
- Query whether at least one portfolio exists with non-empty `role_in_work`.
- Compute readiness:

```ts
const readiness = {
  hasSchoolEmail: appUser.email.endsWith("@kmu.ac.kr"),
  hasBasicInfo: Boolean(appUser.campus && profile.department && profile.grade),
  hasRoleTags: (profile.role_tags ?? []).length > 0,
  hasPortfolio,
  hasRoleInWork,
  hasAvailability: Boolean(profile.availability_status),
  isReady: false,
};
readiness.isReady =
  readiness.hasSchoolEmail &&
  readiness.hasBasicInfo &&
  readiness.hasRoleTags &&
  readiness.hasPortfolio &&
  readiness.hasRoleInWork &&
  readiness.hasAvailability;
```

- [ ] **Step 3: Surface readiness after onboarding save**

In `onboarding/page.tsx`:
- After profile save and optional portfolio save, no badge UI is required yet.
- Ensure the final GET `/api/profiles/me` would return readiness for future cards.

- [ ] **Step 4: Verify**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Commit:

```bash
git add frontend/src/features/portfolios/server/portfolios.ts frontend/src/app/api/portfolios/route.ts frontend/src/features/profile/server/profile-me.ts frontend/src/app/onboarding/page.tsx
git commit -m "포트폴리오 중복 방지와 프로필 준비도 계산"
```

---

## Task 4: Resume Onboarding After Exit

**Goal:** Store onboarding progress and resume at the first incomplete required step.

**Files:**
- Modify: `frontend/src/features/profile/server/profile-me.ts`
- Modify: `frontend/src/app/api/profiles/me/route.ts`
- Modify: `frontend/src/app/onboarding/page.tsx`

**Required step mapping:**
- Step 0 basic info complete: `campus`, `department`, `grade`, `email`
- Step 1 role/tool complete: `roleTags.length > 0`
- Step 2 portfolio optional for onboarding completion, required only for readiness badge
- Step 3 collaboration complete: `availabilityStatus`, `collaborationType`, `weeklyHours`
- Step 4 final confirmation

- [ ] **Step 1: Add `onboardingStep` to profile**

If a DB field is preferred, add migration:

```sql
alter table public.profiles
  add column if not exists onboarding_step integer not null default 0;
```

If avoiding schema expansion, derive the step from profile fields in `getMyProfile()`.

Preferred for MVP: derive step from fields to avoid stale progress state.

- [ ] **Step 2: Compute resume step**

In `profile-me.ts`, add:

```ts
function resolveOnboardingStep(profile: ProfileRecord) {
  if (!profile.campus || !profile.department || !profile.grade) return 0;
  if (!profile.roleTags.length) return 1;
  if (!profile.availabilityStatus || !profile.collaborationType || !profile.weeklyHours) return 3;
  return profile.onboardingCompleted ? 4 : 3;
}
```

Return `onboardingStep` from `getMyProfile()`.

- [ ] **Step 3: Initialize onboarding page step from API**

In `onboarding/page.tsx`:
- When session email exists, call `/api/profiles/me`.
- Set local `step` to returned `onboardingStep`.
- Hydrate local profile state from returned structured fields.

- [ ] **Step 4: Verify**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Commit:

```bash
git add frontend/src/features/profile/server/profile-me.ts frontend/src/app/api/profiles/me/route.ts frontend/src/app/onboarding/page.tsx
git commit -m "온보딩 중간 이탈 복귀 구현"
```

---

## Task 5: Move Client API Calls Into Feature API Modules

**Goal:** Reduce direct `fetch()` calls in `onboarding/page.tsx` and follow the frontend architecture document.

**Files:**
- Create: `frontend/src/features/profile/api/profile-api.ts`
- Create: `frontend/src/features/portfolios/api/portfolio-api.ts`
- Modify: `frontend/src/app/onboarding/page.tsx`
- Optional modify: `frontend/src/features/auth/components/auth-panel.tsx`

**Interfaces to create:**

```ts
// frontend/src/features/profile/api/profile-api.ts
export async function getMyProfileClient(): Promise<ProfileRecord>;
export async function updateMyProfileClient(input: ProfileFormValues): Promise<ProfileRecord>;

// frontend/src/features/portfolios/api/portfolio-api.ts
export async function savePortfolioClient(input: PortfolioFormValues): Promise<PortfolioRecord>;
```

- [ ] **Step 1: Create profile API client**

Create a thin wrapper around:
- `GET /api/profiles/me`
- `PUT /api/profiles/me`

It should parse `{ success, data, message }` and throw `Error(message)` on failure.

- [ ] **Step 2: Create portfolio API client**

Create a thin wrapper around:
- `POST /api/portfolios`

It should parse `{ success, data, message }` and throw `Error(message)` on failure.

- [ ] **Step 3: Refactor onboarding page**

Replace direct profile/portfolio fetch calls in `onboarding/page.tsx` with the API client functions.

Do not change UI behavior in this task.

- [ ] **Step 4: Optionally refactor AuthPanel**

If the change is low-risk, replace direct profile fetch calls in `AuthPanel` with `getMyProfileClient()` and `updateMyProfileClient()`.

If it would expand the scope too much, leave AuthPanel for a later commit.

- [ ] **Step 5: Verify**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Commit:

```bash
git add frontend/src/features/profile/api/profile-api.ts frontend/src/features/portfolios/api/portfolio-api.ts frontend/src/app/onboarding/page.tsx frontend/src/features/auth/components/auth-panel.tsx
git commit -m "온보딩 API 호출 모듈 분리"
```

---

## Final Verification

After all tasks:

```powershell
npm.cmd run typecheck
npm.cmd run lint
git status --short
git log --oneline -8
```

Expected:
- Typecheck passes.
- Lint passes.
- Working tree is clean except for intentionally uncommitted local files.

## Cursor Composer 2 Prompt

Use this exact handoff prompt:

```text
You are Cursor Composer 2 working in D:\git_camp\campus-link.

Read docs/superpowers/plans/2026-07-08-onboarding-completion-roadmap.md first.

Execute the plan task-by-task in order. Do not combine tasks. Commit after each task if typecheck and lint pass.

Priority order:
1. Task 1: Store onboarding profile data structurally
2. Task 2: Enforce school email policy
3. Task 3: Prevent duplicate portfolio records and add readiness conditions
4. Task 4: Resume onboarding after exit
5. Task 5: Move client API calls into feature API modules

Do not rewrite unrelated project areas. Do not revert existing commits. Keep changes narrow and report any schema mismatch before inventing a workaround.

At the end of each task, report:
- files changed
- command results for npm.cmd run typecheck and npm.cmd run lint
- commit hash
- any blocker or deviation from the plan
```

## Self-Review

**Spec coverage:**
- Covers structured onboarding data, school email validation, portfolio duplicate prevention, readiness conditions, resume-after-exit, and feature API module separation.
- Does not cover project listing, applications/proposals, recommendations, or contact reveal after acceptance.

**Placeholder scan:**
- The plan contains no `TBD` or unspecified implementation placeholders. Optional branches are explicitly constrained.

**Type consistency:**
- New profile fields are named consistently across DB migration, server types, route parser, and onboarding payload.
- New client API module names are stable and referenced in later tasks.
