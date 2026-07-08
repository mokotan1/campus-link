# Onboarding Data Integrity And Demo Stability Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the current onboarding/profile data-loss risks, improve Next.js + Supabase data consistency, and make the auth/onboarding demo path stable enough for presentation.

**Architecture:** Keep the current Next.js Route Handler + Supabase server module pattern. Do not introduce a large state library or broad refactor. Fix correctness first, then add small guardrails and QA affordances.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Auth, Supabase PostgreSQL, Tailwind CSS, existing feature API modules.

## Global Constraints

- 서버에서 사용자 권한을 확인할 때는 클라이언트가 보낸 사용자 ID를 신뢰하지 않고 Supabase 세션의 사용자 ID를 기준으로 판단한다.
- MVP에서는 파일 업로드를 제외하고 외부 포트폴리오 링크만 저장한다.
- 클라이언트 validation은 UX 보조 수단으로만 사용하고, 최종 검증은 서버 로직과 데이터베이스 정책에서 수행한다.
- 사용자는 본인 프로필, 본인 지원 내역, 본인이 등록한 프로젝트만 수정할 수 있어야 한다.
- API 연결 코드는 feature별 API 모듈에 두고 page 파일에 직접 fetch 로직을 몰아넣지 않는다.

---

## Current Problems To Fix

1. `AuthPanel` profile save can erase onboarding structured fields.
   - File: `frontend/src/features/auth/components/auth-panel.tsx`
   - Current behavior sends empty `displayName`, `campus`, `roleTags`, `availabilityStatus`, `collaborationType`, `weeklyHours`, and `onboardingCompleted: false`.

2. Onboarding resume hydration can mix stale local state with current DB data.
   - File: `frontend/src/app/onboarding/page.tsx`
   - Current behavior falls back to `current.*` when DB fields are empty.

3. School email readiness calculation duplicates domain logic.
   - File: `frontend/src/features/profile/server/profile-me.ts`
   - Current behavior uses `email.endsWith("@kmu.ac.kr")` instead of `isSchoolEmail()`.

4. School email domain is hardcoded.
   - File: `frontend/src/features/auth/lib/school-email.ts`
   - Acceptable for demo only if documented and easy to change.

5. Demo failure modes are under-specified.
   - Need a deterministic manual QA checklist for sign-up, sign-in, onboarding save, resume, and portfolio upsert.

---

## Task 1: Prevent AuthPanel From Erasing Onboarding Data

**Goal:** Make the small profile form in `AuthPanel` update only the fields it owns while preserving all onboarding fields.

**Files:**
- Modify: `frontend/src/features/auth/components/auth-panel.tsx`
- Optional modify: `frontend/src/features/profile/api/profile-api.ts`

**Implementation approach:**
- Before `updateMyProfileClient()` in `handleProfileSubmit`, fetch the existing full profile with `getMyProfileClient()`.
- Merge editable AuthPanel fields into the existing profile.
- Preserve:
  - `displayName`
  - `campus`
  - `roleTags`
  - `availabilityStatus`
  - `collaborationType`
  - `weeklyHours`
  - `onboardingCompleted`

- [ ] **Step 1: Replace destructive payload**

Change `handleProfileSubmit()` from:

```ts
await updateMyProfileClient({
  displayName: "",
  campus: "",
  studentId: profile.studentId,
  department: profile.department,
  grade: profile.grade,
  bio: profile.bio,
  roleTags: [],
  techStack: profile.techStack,
  availabilityStatus: "",
  collaborationType: "",
  weeklyHours: "",
  collaborationStatus: profile.collaborationStatus,
  onboardingCompleted: false,
});
```

to:

```ts
const currentProfile = await getMyProfileClient();

const data = await updateMyProfileClient({
  displayName: currentProfile.displayName,
  campus: currentProfile.campus,
  studentId: profile.studentId,
  department: profile.department,
  grade: profile.grade,
  bio: profile.bio,
  roleTags: currentProfile.roleTags,
  techStack: profile.techStack,
  availabilityStatus: currentProfile.availabilityStatus,
  collaborationType: currentProfile.collaborationType,
  weeklyHours: currentProfile.weeklyHours,
  collaborationStatus: profile.collaborationStatus,
  onboardingCompleted: currentProfile.onboardingCompleted,
});
```

- [ ] **Step 2: Verify AuthPanel still updates visible fields**

Manual check:
- Save `studentId`, `department`, `grade`, `bio`, `techStack`, `collaborationStatus`.
- Confirm returned `data` updates the local AuthPanel state.

- [ ] **Step 3: Run verification**

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Commit:

```bash
git add frontend/src/features/auth/components/auth-panel.tsx
git commit -m "프로필 저장 시 온보딩 데이터 보존"
```

---

## Task 2: Make Onboarding Hydration Deterministic

**Goal:** Avoid stale state leakage when switching users or resuming onboarding.

**Files:**
- Modify: `frontend/src/app/onboarding/page.tsx`

**Implementation approach:**
- Use server response as the source of truth when profile loading succeeds.
- Fall back to known default values, not `current`.
- Reset local onboarding profile when session disappears.

- [ ] **Step 1: Add a local mapping helper**

In `onboarding/page.tsx`, add a helper near `parsePortfolioThumbnail()`:

```ts
function mapProfileRecordToOnboardingState(data: ProfileRecord, fallbackEmail: string) {
  return {
    name: data.displayName,
    campus: (data.campus || "대명캠") as Campus,
    department: data.department,
    grade: data.grade || "1학년",
    email: data.email || fallbackEmail,
    roles: data.roleTags,
    tools: data.techStack,
    availabilityStatus: data.availabilityStatus || "바로 가능",
    collaborationType: data.collaborationType || "졸업작품",
    weeklyHours: data.weeklyHours || "4-7시간",
    completed: data.onboardingCompleted,
  };
}
```

Import `ProfileRecord` type from `@/features/profile/types`.

- [ ] **Step 2: Replace current-state fallbacks**

Replace:

```ts
setProfile((current) => ({
  ...current,
  name: data.displayName || current.name,
  campus: (data.campus || current.campus) as Campus,
  ...
}));
```

with:

```ts
setProfile(mapProfileRecordToOnboardingState(data, email));
```

- [ ] **Step 3: Reset state when session disappears**

In the auth state change handler, when `email` is null:
- set `sessionEmail` to null
- set `step` to `0`
- clear portfolio local fields
- reset `saveMessage`

Do not preserve prior user's profile data.

- [ ] **Step 4: Run verification**

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Commit:

```bash
git add frontend/src/app/onboarding/page.tsx
git commit -m "온보딩 재진입 상태 초기화 보강"
```

---

## Task 3: Centralize School Email Consistency

**Goal:** Use one school email policy everywhere so readiness, bootstrap, and UI validation cannot drift.

**Files:**
- Modify: `frontend/src/features/auth/lib/school-email.ts`
- Modify: `frontend/src/features/profile/server/profile-me.ts`
- Modify: `docs/qa-auth-onboarding.md`

**Implementation approach:**
- Export the allowed domain list or a display string from `school-email.ts`.
- Use `isSchoolEmail()` in `computeProfileReadiness()`.
- Document demo domain.

- [ ] **Step 1: Export allowed domains**

Change `school-email.ts` to:

```ts
export const allowedSchoolDomains = ["kmu.ac.kr"] as const;
```

Keep `getEmailDomain()`, `isSchoolEmail()`, and `schoolEmailMessage()`.

- [ ] **Step 2: Use helper in readiness**

In `profile-me.ts`, import:

```ts
import { isSchoolEmail } from "@/features/auth/lib/school-email";
```

Change:

```ts
hasSchoolEmail: email.endsWith("@kmu.ac.kr"),
```

to:

```ts
hasSchoolEmail: isSchoolEmail(email),
```

- [ ] **Step 3: Document demo domain in QA checklist**

Add to `docs/qa-auth-onboarding.md`:

```md
> School email domain: `kmu.ac.kr`.
```

- [ ] **Step 4: Run verification**

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Commit:

```bash
git add frontend/src/features/auth/lib/school-email.ts frontend/src/features/profile/server/profile-me.ts docs/qa-auth-onboarding.md
git commit -m "학교 이메일 정책 공통화"
```

---

## Task 4: Add Demo Stability Guardrails

**Goal:** Make the presentation flow predictable even when optional APIs fail or data is missing.

**Files:**
- Modify: `frontend/src/app/onboarding/page.tsx`
- Modify: `docs/qa-auth-onboarding.md`

**Implementation approach:**
- Keep profile loading failure visible instead of silently continuing.
- Make portfolio hydration failure non-blocking but visible as a subtle message only when needed.
- Disable final save while profile loading is in progress.

- [ ] **Step 1: Track profile load message**

Add:

```ts
const [profileLoadMessage, setProfileLoadMessage] = useState("");
```

When `getMyProfileClient()` fails:
- set message to `"저장된 프로필을 불러오지 못했습니다. 기본값으로 온보딩을 시작합니다."`

Render it as a small neutral message above the onboarding card.

- [ ] **Step 2: Disable final save during profile loading**

Update the final button disabled condition:

```tsx
disabled={saving || loadingProfile}
```

- [ ] **Step 3: Update QA checklist**

Add manual checks:
- Profile GET failure shows fallback message.
- Portfolio GET failure does not block onboarding.
- Final save button is disabled while profile is loading.
- Switching accounts does not show previous user's profile values.

- [ ] **Step 4: Run verification**

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Commit:

```bash
git add frontend/src/app/onboarding/page.tsx docs/qa-auth-onboarding.md
git commit -m "온보딩 시연 안정성 보강"
```

---

## Task 5: Final Review And Manual QA Pass

**Goal:** Verify the full auth/onboarding demo path after the data integrity fixes.

**Files:**
- Modify: `docs/qa-auth-onboarding.md` only if observations need to be recorded.

- [ ] **Step 1: Run static checks**

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

Expected:
- Both pass.

- [ ] **Step 2: Run manual demo checklist**

Use `docs/qa-auth-onboarding.md`.

Minimum required manual cases:
- School email sign-up or sign-in.
- Non-school email blocked.
- Onboarding completion stores structured profile fields.
- AuthPanel profile save does not reset onboarding completion.
- Same portfolio URL updates instead of duplicates.
- Logout/login as another user does not leak previous profile state.

- [ ] **Step 3: Record any known limitations**

If real Supabase credentials or email confirmation are not available locally, add a short note under a `## Known QA Limits` section in `docs/qa-auth-onboarding.md`.

Commit:

```bash
git add docs/qa-auth-onboarding.md
git commit -m "온보딩 QA 결과 정리"
```

---

## Cursor Composer Prompt

```text
You are Cursor Composer working in D:\git_camp\campus-link.

Read docs/superpowers/plans/2026-07-08-onboarding-data-integrity-demo-stability.md first.

Execute the tasks in order. Do not combine tasks. After each task, run:
- npm.cmd run typecheck
- npm.cmd run lint

Commit after each task if both checks pass.

Primary priorities:
1. Prevent AuthPanel profile save from erasing onboarding structured fields.
2. Make onboarding resume/hydration deterministic across account switches.
3. Centralize school email policy.
4. Add demo stability guardrails and QA notes.

Do not rewrite unrelated project areas. Do not revert existing commits. If a suggested change conflicts with current schema or API behavior, stop and report the exact mismatch.
```

## Final Verification

```powershell
npm.cmd run typecheck
npm.cmd run lint
git status --short
git log --oneline -8
```

Expected:
- Typecheck passes.
- Lint passes.
- Working tree is clean except intentionally uncommitted local planning docs.

## Self-Review

**Spec coverage:** Covers data-loss fix, hydration correctness, school email consistency, and demo stability. Does not attempt broader project/application/proposal flows.

**Placeholder scan:** No `TBD` or open-ended implementation steps.

**Type consistency:** Uses existing `ProfileFormValues`, `ProfileRecord`, and current feature API module names.
