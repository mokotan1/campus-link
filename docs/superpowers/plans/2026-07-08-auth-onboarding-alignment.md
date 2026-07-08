# Auth Onboarding Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the current auth and onboarding implementation closer to the Campus Link PRD by fixing the unsafe bootstrap flow, preserving profile data, and aligning onboarding data capture with the MVP requirements.

**Architecture:** Keep Next.js App Router pages thin where practical, but avoid broad refactors during this pass. Server-side identity must come from the Supabase session, not browser-provided user IDs. Onboarding should save only the data it owns or preserve existing profile fields before issuing a full profile update.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Auth, Supabase PostgreSQL, Tailwind CSS, existing Route Handlers.

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

## Current Workflow Snapshot

**Branch:** `codex/fend-api-integration`

**Latest reviewed commit:** `eb9e102a086c30a883c66f8252c1218e77dfc9bf`

**Commit title:** `feat: add onboarding auth flow`

**Files changed in latest commit:**
- `frontend/src/app/auth/page.tsx`
- `frontend/src/app/onboarding/page.tsx`
- `frontend/src/features/auth/components/auth-panel.tsx`
- `frontend/src/shared/lib/app-data-context.tsx`

**What the commit currently does:**
- Replaces the placeholder `/auth` page with `AuthPanel`.
- Adds Supabase sign-up, sign-in, sign-out UI.
- Adds a profile read/write panel inside `AuthPanel`.
- Gates `/onboarding` behind a Supabase session.
- Syncs session email into the onboarding profile.
- Saves onboarding data to `/api/profiles/me` before navigating to `/projects`.
- Changes `setProfile` typing to support functional state updates.

**Planning assessment against Campus Link PRD:**
- One-week target progress: about 45-55%.
- Auth and onboarding entry flow: about 55%.
- UI flow alignment: about 70%.
- API/data model alignment: about 40%.
- Security/authorization alignment: about 30%.

**Primary reason progress is not higher:** The feature exists visually, but the auth bootstrap and onboarding persistence do not yet fully match the PRD security and data requirements.

## Review Findings To Address

### Critical

1. `frontend/src/features/auth/components/auth-panel.tsx`
   - `bootstrapAppUser(authUserId, email)` sends client-provided identity to `/api/auth/bootstrap`.
   - This violates the PRD security rule that server authorization must not trust client-provided user IDs.

2. `frontend/src/app/api/auth/bootstrap/route.ts`
   - Reads `authUserId` and `email` from `request.json()`.
   - Calls `bootstrapUser({ authUserId, email })` with unverified identity.

3. `frontend/src/features/auth/server/bootstrap-user.ts`
   - Uses service-role admin client to create `users` and `profiles` rows from caller-provided identity.
   - Must derive identity from the authenticated Supabase session or a verified token.

### Important

1. `frontend/src/features/auth/components/auth-panel.tsx`
   - `handleSubmit` uses `try/finally` without `catch`.
   - Bootstrap/profile failures can leave a stale "processing" message.

2. `frontend/src/app/onboarding/page.tsx`
   - `finishOnboarding()` sends `studentId: ""`.
   - Existing `student_id` is cleared because the API maps empty string to `null`.

3. `frontend/src/app/onboarding/page.tsx`
   - The email field renders `profile.email || sessionEmail || ""`.
   - A stale global profile email can briefly win over the active session email.

### Planning Gaps

1. Onboarding step 3 does not persist external portfolio link, thumbnail URL, or role in work.
2. The current UI uses `FileDropField`, but the MVP explicitly excludes direct file upload.
3. Roles, tools, collaboration type, weekly hours, and availability status are folded partly into `bio` instead of being stored as structured data.
4. Page files still contain direct Supabase/fetch orchestration instead of feature API modules.
5. School email domain validation is not implemented.

## Next Goal For Cursor Composer 2

**Goal:** Stabilize the auth and onboarding foundation so it is safe enough to continue the 1-week milestone.

**Definition of done:**
- `/api/auth/bootstrap` no longer trusts `authUserId` or `email` from request body.
- Auth bootstrap derives the current Supabase user server-side.
- Auth submit failures show a clear error message.
- Onboarding save does not erase existing profile fields it does not own.
- Read-only onboarding email always reflects the current Supabase session.
- TypeScript errors introduced by the latest auth/onboarding commit are resolved.
- The code path remains compatible with the existing `/api/profiles/me` route.

---

## File Responsibility Map

**Modify: `frontend/src/app/api/auth/bootstrap/route.ts`**
- Responsibility: Handle authenticated bootstrap requests.
- It should ignore browser-provided user identity.

**Modify: `frontend/src/features/auth/server/bootstrap-user.ts`**
- Responsibility: Create or find the app user and profile using trusted server-derived Supabase auth identity.
- It should accept trusted identity only, or expose a helper that derives identity before calling insert/upsert logic.

**Modify: `frontend/src/features/auth/components/auth-panel.tsx`**
- Responsibility: Auth UI, user feedback, and authenticated calls to bootstrap/profile endpoints.
- It should call bootstrap without sending `authUserId` and `email`.
- It should handle thrown submit errors.

**Modify: `frontend/src/app/onboarding/page.tsx`**
- Responsibility: 5-step onboarding UI and final onboarding save.
- It should preserve existing profile fields not captured by onboarding.
- It should render the active session email directly.
- It should type Supabase auth callback parameters or otherwise avoid implicit `any`.

**Optional create: `frontend/src/features/profile/api/profile-api.ts`**
- Responsibility: Client-side wrappers for `GET /api/profiles/me` and `PUT /api/profiles/me`.
- Use only if keeping the change small still allows it. Do not perform a broad API layer refactor in this pass.

---

## Task 1: Secure Auth Bootstrap

**Files:**
- Modify: `frontend/src/app/api/auth/bootstrap/route.ts`
- Modify: `frontend/src/features/auth/server/bootstrap-user.ts`
- Modify: `frontend/src/features/auth/components/auth-panel.tsx`

**Interfaces:**
- Consumes: Supabase server session from `frontend/src/lib/supabase/server.ts`
- Produces: `POST /api/auth/bootstrap` that requires an authenticated session and creates the app user/profile for that session only.

- [ ] **Step 1: Inspect current server Supabase helper**

Run:

```powershell
Get-Content -Encoding UTF8 -LiteralPath 'frontend/src/lib/supabase/server.ts'
Get-Content -Encoding UTF8 -LiteralPath 'frontend/src/features/auth/server/current-app-user.ts'
```

Expected:
- Confirm how server code reads Supabase auth session/user.
- Reuse the existing pattern instead of inventing a new auth mechanism.

- [ ] **Step 2: Change bootstrap route to ignore body identity**

Implementation target:
- `POST /api/auth/bootstrap` should not require `authUserId` or `email` in the JSON body.
- It should derive the authenticated Supabase user server-side.
- If no authenticated user exists, return the existing unauthorized response helper.

Expected behavior:
- Unauthenticated request returns 401.
- Authenticated request creates or finds the app user/profile for the current Supabase auth user.

- [ ] **Step 3: Update `bootstrapUser` to accept trusted identity only**

Implementation target:

```ts
export type BootstrapPayload = {
  authUserId: string;
  email: string;
};
```

may stay, but the only caller must pass values obtained server-side. The browser must not be the source of these values.

Expected behavior:
- Existing insert/upsert behavior remains.
- `users.auth_user_id` still receives the Supabase auth user id.
- `users.email` still receives the Supabase auth email.

- [ ] **Step 4: Update AuthPanel bootstrap calls**

Implementation target:
- Replace `bootstrapAppUser(authUserId, authEmail)` with `bootstrapAppUser()`.
- `bootstrapAppUser()` should call `/api/auth/bootstrap` with `POST` and no identity payload.

Expected behavior:
- Sign-in path still bootstraps and loads profile.
- Sign-up path only bootstraps immediately if a session exists.
- If sign-up returns no session because email confirmation is required, show the existing "email confirmation" message and do not call bootstrap.

- [ ] **Step 5: Verify**

Run:

```powershell
npm.cmd run typecheck
```

Expected:
- No new errors from `auth-panel.tsx`, `route.ts`, or `bootstrap-user.ts`.
- Existing unrelated type errors may remain; record them in the final report.

Commit:

```bash
git add frontend/src/app/api/auth/bootstrap/route.ts frontend/src/features/auth/server/bootstrap-user.ts frontend/src/features/auth/components/auth-panel.tsx
git commit -m "fix: secure auth bootstrap flow"
```

## Task 2: Improve AuthPanel Error Handling

**Files:**
- Modify: `frontend/src/features/auth/components/auth-panel.tsx`

**Interfaces:**
- Consumes: `bootstrapAppUser()` from the same file.
- Produces: submit flow that always resolves UI state into success or error message.

- [ ] **Step 1: Add `catch` to `handleSubmit`**

Implementation target:

```ts
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "인증 처리에 실패했습니다.",
      });
    } finally {
      setPending(false);
    }
```

Expected behavior:
- API/network/bootstrap/profile failures display an error message.
- Submit button is re-enabled.

- [ ] **Step 2: Type Supabase auth callback if needed**

If `npm.cmd run typecheck` reports implicit `any` for `onAuthStateChange`, import the required Supabase types from `@supabase/supabase-js` or annotate the callback using the inferred return types supported by the installed package.

Expected behavior:
- No implicit `any` in this file.

- [ ] **Step 3: Verify**

Run:

```powershell
npm.cmd run typecheck
```

Expected:
- No errors from `frontend/src/features/auth/components/auth-panel.tsx`.

Commit:

```bash
git add frontend/src/features/auth/components/auth-panel.tsx
git commit -m "fix: handle auth panel submit failures"
```

## Task 3: Preserve Profile Data During Onboarding Save

**Files:**
- Modify: `frontend/src/app/onboarding/page.tsx`
- Optional create: `frontend/src/features/profile/api/profile-api.ts`

**Interfaces:**
- Consumes: `GET /api/profiles/me`
- Consumes: `PUT /api/profiles/me`
- Produces: onboarding save that does not clear fields outside onboarding's ownership.

- [ ] **Step 1: Load current profile before final save**

Implementation target:
- Before `PUT /api/profiles/me`, call `GET /api/profiles/me`.
- Preserve `studentId` from the existing profile payload.

Expected behavior:
- If profile GET succeeds, `studentId` is carried into the PUT body.
- If profile GET fails, show an error and do not overwrite profile with incomplete data.

- [ ] **Step 2: Update final save payload**

Implementation target:

```ts
body: JSON.stringify({
  studentId: currentProfile.studentId,
  department: profile.department,
  grade: profile.grade,
  bio: bioLines.join("\n"),
  techStack: profile.tools,
  collaborationStatus,
})
```

Expected behavior:
- Existing student id is not set to `null`.
- Onboarding-owned fields still update.

- [ ] **Step 3: Render session email directly**

Implementation target:

```tsx
value={sessionEmail ?? ""}
readOnly
```

Expected behavior:
- The read-only email always reflects the active Supabase session.

- [ ] **Step 4: Fix implicit `any` in onboarding auth callback**

Expected behavior:
- `npm.cmd run typecheck` no longer reports implicit `any` for `frontend/src/app/onboarding/page.tsx`.

- [ ] **Step 5: Verify**

Run:

```powershell
npm.cmd run typecheck
```

Expected:
- No errors from `frontend/src/app/onboarding/page.tsx`.

Commit:

```bash
git add frontend/src/app/onboarding/page.tsx frontend/src/features/profile/api/profile-api.ts
git commit -m "fix: preserve profile fields during onboarding"
```

## Task 4: Align Onboarding Step 3 With MVP Portfolio Policy

**Files:**
- Modify: `frontend/src/app/onboarding/page.tsx`
- Inspect: `frontend/src/features/portfolios/server/portfolios.ts`
- Inspect: `frontend/src/app/api/portfolios/route.ts`

**Interfaces:**
- Consumes: `POST /api/portfolios` if available and compatible.
- Produces: onboarding step 3 that captures external portfolio link and role in work without direct file upload.

- [ ] **Step 1: Inspect existing portfolio API**

Run:

```powershell
Get-Content -Encoding UTF8 -LiteralPath 'frontend/src/app/api/portfolios/route.ts'
Get-Content -Encoding UTF8 -LiteralPath 'frontend/src/features/portfolios/server/portfolios.ts'
```

Expected:
- Determine whether `POST /api/portfolios` can store `externalUrl` and `roleInWork`.

- [ ] **Step 2: Replace file-upload-oriented UI**

Implementation target:
- Remove or stop using `FileDropField` in onboarding step 3 for MVP.
- Add controlled fields for:
  - external portfolio link
  - representative thumbnail URL if supported
  - role in work

Expected behavior:
- The UI matches the PRD's MVP rule: external links, no direct file upload.

- [ ] **Step 3: Persist portfolio information**

Implementation target:
- If portfolio API is available, call `POST /api/portfolios` with the captured link and role.
- If not available or incompatible, keep the fields in local onboarding state and do not fake persistence.

Expected behavior:
- User-entered portfolio link is not silently discarded.
- If persistence fails, show an error and keep the user on onboarding.

- [ ] **Step 4: Verify**

Run:

```powershell
npm.cmd run typecheck
```

Expected:
- No new errors from onboarding or portfolio files touched in this task.

Commit:

```bash
git add frontend/src/app/onboarding/page.tsx
git commit -m "feat: align onboarding portfolio step with mvp"
```

## Task 5: Add Minimum Manual QA Notes

**Files:**
- Create or modify: `docs/qa-auth-onboarding.md`

**Interfaces:**
- Produces: manual QA checklist for the auth/onboarding flow.

- [ ] **Step 1: Add checklist**

Include these cases:
- Sign up with a valid school email.
- Sign up when Supabase requires email confirmation.
- Sign in with an existing account.
- Sign out and verify onboarding returns to auth gate.
- Complete onboarding and verify profile save.
- Complete onboarding after editing student id elsewhere and verify student id is preserved.
- Attempt onboarding save with API failure and verify error state.
- Switch accounts and verify read-only onboarding email changes to the new session email.

- [ ] **Step 2: Commit**

```bash
git add docs/qa-auth-onboarding.md
git commit -m "docs: add auth onboarding qa checklist"
```

## Verification Summary For Composer 2

Run at the end:

```powershell
npm.cmd run typecheck
npm.cmd run lint
git status --short
git log --oneline -5
```

Known current verification state before this plan:
- `npm.cmd run typecheck` fails.
- Latest-commit-related failures include implicit `any` in `frontend/src/app/onboarding/page.tsx` and `frontend/src/features/auth/components/auth-panel.tsx`.
- Other existing type errors appear in server feature files and Supabase dependency resolution.
- `npm.cmd run lint` fails on an existing `react-hooks/set-state-in-effect` warning/error in `frontend/src/shared/lib/app-data-context.tsx`.

## Handoff Prompt For Cursor Composer 2

Use this exact prompt:

```text
You are Cursor Composer 2 working in D:\git_camp\campus-link.

Read docs/superpowers/plans/2026-07-08-auth-onboarding-alignment.md first and execute the plan in order.

Primary objective: secure the auth bootstrap flow and stabilize onboarding save behavior before expanding feature scope.

Do not rewrite unrelated project areas. Do not revert user changes. Keep each task small and commit after each task if the working tree is clean enough to do so.

Prioritize:
1. Task 1: Secure Auth Bootstrap
2. Task 2: Improve AuthPanel Error Handling
3. Task 3: Preserve Profile Data During Onboarding Save

Only start Task 4 after Tasks 1-3 are verified, because portfolio persistence may touch a wider feature slice.

At the end, report:
- files changed
- commits made
- typecheck/lint results
- any remaining blockers
```

## Self-Review

**Spec coverage:**
- Covers Supabase Auth, server-side session trust, onboarding save, and MVP portfolio policy.
- Does not cover project registration, applications, proposals, recommendations, or full dashboard work. Those belong to later 2-week and 3-week targets.

**Placeholder scan:**
- No `TBD`, `TODO`, or undefined future work placeholders are required for execution.

**Type consistency:**
- Uses existing route names: `/api/auth/bootstrap`, `/api/profiles/me`, `/api/portfolios`.
- Uses existing frontend paths from the current branch.
