# Next.js Supabase Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish a working Next.js + Supabase authentication flow today with sign-up, sign-in, session display, sign-out, and automatic `users` / `profiles` row creation.

**Architecture:** Keep Supabase Auth as the identity system in the browser, then call a Next.js server route after successful sign-up to create application-level rows in `users` and `profiles`. Adapt the existing SQL schema minimally so it can map a Supabase Auth UUID to the app's numeric `users.id` primary key.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `@supabase/supabase-js`, `@supabase/ssr`, Supabase Auth, Supabase Postgres.

---

## File Structure

- Modify: `backend/src/main/resources/db/migration/V1__create_mvp_core_tables.sql`
  - Current MVP schema reference. Use it to understand existing required columns and constraints.
- Create: `docs/superpowers/specs/2026-07-06-nextjs-auth-design.md`
  - Already written design spec for this work.
- Create: `docs/superpowers/plans/2026-07-06-nextjs-supabase-auth.md`
  - This implementation plan.
- Modify: `frontend/src/features/auth/components/auth-panel.tsx`
  - Extend current auth panel so sign-up also requests app user/profile initialization and shows clearer state.
- Create: `frontend/src/app/api/auth/bootstrap/route.ts`
  - Server route for creating or reusing `users` and `profiles` rows after sign-up.
- Create: `frontend/src/lib/supabase/admin.ts`
  - Server-only Supabase admin client using service role key.
- Create: `frontend/src/features/auth/server/bootstrap-user.ts`
  - Shared server helper containing the actual bootstrap logic.
- Modify: `frontend/src/lib/supabase/env.ts`
  - Add server-side env access for service role key and optional guards.
- Modify: `frontend/.env.example`
  - Add service role key placeholder if missing.
- Modify: `frontend/README.md`
  - Add exact auth setup / test steps.
- Create: `frontend/src/features/auth/server/bootstrap-user.testable.ts` (optional small pure helper if needed)
  - Only if needed to keep mapping logic testable without adding a full runner.

### Task 1: Align the app user schema with Supabase Auth

**Files:**
- Create: `frontend/supabase/migrations/20260706_auth_user_bridge.sql` (or Supabase SQL snippet if migrations folder is absent)
- Reference: `backend/src/main/resources/db/migration/V1__create_mvp_core_tables.sql`
- Modify: `docs/supabase-setup.md`

- [ ] **Step 1: Inspect the current user/profile schema constraints**

```sql
-- Existing blockers to note from the current schema:
-- users.id BIGSERIAL
-- users.password_hash NOT NULL
-- users.name NOT NULL
-- users.role NOT NULL
-- profiles.user_id references users.id
```

- [ ] **Step 2: Write the failing schema intent in the plan notes**

Expected issue: a Supabase Auth user has a UUID id, but the current `users.id` is numeric and there is no `auth_user_id` bridge column.

- [ ] **Step 3: Create the minimal schema migration SQL**

```sql
alter table public.users
  add column if not exists auth_user_id uuid unique;

alter table public.users
  alter column password_hash drop not null,
  alter column name drop not null;

alter table public.users
  alter column role set default 'STUDENT',
  alter column auth_provider set default 'SUPABASE';

update public.users
set auth_provider = 'SUPABASE'
where auth_provider is null;
```

- [ ] **Step 4: Add a not-null guarantee only after bootstrap path is ready**

```sql
-- Run only after verifying sign-up flow works for new users.
alter table public.users
  alter column auth_user_id set not null;
```

- [ ] **Step 5: Document how to apply the SQL in Supabase**

Add a short section to `docs/supabase-setup.md` telling the user to run the SQL in the Supabase SQL editor before testing sign-up.

- [ ] **Step 6: Commit**

```bash
git add docs/supabase-setup.md frontend/supabase/migrations/20260706_auth_user_bridge.sql
git commit -m "feat: prepare schema for supabase auth users"
```

### Task 2: Add a server-only Supabase admin client

**Files:**
- Modify: `frontend/src/lib/supabase/env.ts`
- Create: `frontend/src/lib/supabase/admin.ts`
- Test: `frontend npm run typecheck`

- [ ] **Step 1: Write the failing usage expectation**

We need a server-only helper that can safely use the service role key. Browser code must never import it.

- [ ] **Step 2: Extend env helpers for the server key**

```ts
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseServerEnv() {
  if (!supabaseUrl || !supabasePublishableKey || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase server environment variables are missing. Check frontend/.env.local."
    );
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
    serviceRoleKey: supabaseServiceRoleKey,
  };
}
```

- [ ] **Step 3: Create the admin client helper**

```ts
import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseServerEnv } from "./env";

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServerEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

- [ ] **Step 4: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/supabase/env.ts frontend/src/lib/supabase/admin.ts
git commit -m "feat: add supabase admin client"
```

### Task 3: Implement user/profile bootstrap logic on the server

**Files:**
- Create: `frontend/src/features/auth/server/bootstrap-user.ts`
- Create: `frontend/src/app/api/auth/bootstrap/route.ts`
- Test: `frontend npm run typecheck`

- [ ] **Step 1: Define the bootstrap contract**

```ts
export type BootstrapPayload = {
  authUserId: string;
  email: string;
};
```

- [ ] **Step 2: Create the shared bootstrap helper**

```ts
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function bootstrapUser({ authUserId, email }: BootstrapPayload) {
  const supabase = createAdminClient();
  const name = email.split("@")[0] || "new-user";

  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (existingUserError) {
    throw new Error(existingUserError.message);
  }

  let appUserId = existingUser?.id as number | undefined;

  if (!appUserId) {
    const { data: insertedUser, error: insertUserError } = await supabase
      .from("users")
      .insert({
        auth_user_id: authUserId,
        email,
        password_hash: null,
        name,
        role: "STUDENT",
        auth_provider: "SUPABASE",
      })
      .select("id")
      .single();

    if (insertUserError) {
      throw new Error(insertUserError.message);
    }

    appUserId = insertedUser.id;
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: appUserId,
      collaboration_status: "OPEN",
    },
    { onConflict: "user_id" }
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  return { appUserId };
}
```

- [ ] **Step 3: Add the Next.js route handler**

```ts
import { NextResponse } from "next/server";

import { bootstrapUser } from "@/features/auth/server/bootstrap-user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authUserId = String(body.authUserId ?? "").trim();
    const email = String(body.email ?? "").trim();

    if (!authUserId || !email) {
      return NextResponse.json(
        { success: false, message: "authUserId와 email이 필요합니다." },
        { status: 400 }
      );
    }

    const result = await bootstrapUser({ authUserId, email });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/server/bootstrap-user.ts frontend/src/app/api/auth/bootstrap/route.ts
 git commit -m "feat: add auth bootstrap route"
```

### Task 4: Connect the auth panel to the bootstrap route

**Files:**
- Modify: `frontend/src/features/auth/components/auth-panel.tsx`
- Test: `frontend npm run typecheck`
- Test: `frontend npm run lint`

- [ ] **Step 1: Write the failing flow expectation**

After sign-up succeeds, the UI must create app user/profile rows before showing final success.

- [ ] **Step 2: Add a small helper for the bootstrap call**

```ts
async function bootstrapAppUser(authUserId: string, userEmail: string) {
  const response = await fetch("/api/auth/bootstrap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authUserId, email: userEmail }),
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "사용자 기본 데이터 생성에 실패했습니다.");
  }
}
```

- [ ] **Step 3: Update sign-up handling**

```ts
if (mode === "sign-up") {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    setMessage({ tone: "error", text: error.message });
    return;
  }

  const authUserId = data.user?.id;
  const userEmail = data.user?.email;

  if (!authUserId || !userEmail) {
    setMessage({
      tone: "error",
      text: "회원가입은 되었지만 사용자 정보를 읽지 못했습니다.",
    });
    return;
  }

  await bootstrapAppUser(authUserId, userEmail);

  setMessage({
    tone: "success",
    text: "회원가입과 기본 프로필 생성이 완료되었습니다.",
  });
  return;
}
```

- [ ] **Step 4: Improve the session state text**

```ts
<div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
  현재 세션: {sessionEmail ?? "없음"}
</div>
```

Keep this visible after sign-up, sign-in, and sign-out so manual testing is obvious.

- [ ] **Step 5: Run lint and typecheck**

Run: `cd frontend && npm run lint`
Expected: PASS

Run: `cd frontend && npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/auth/components/auth-panel.tsx
git commit -m "feat: connect sign up to app user bootstrap"
```

### Task 5: Update docs and run manual verification

**Files:**
- Modify: `frontend/README.md`
- Modify: `docs/supabase-setup.md`

- [ ] **Step 1: Add exact local setup notes**

Document these required local env keys in `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

- [ ] **Step 2: Add manual verification steps**

```md
1. Run `cd frontend && npm run dev`
2. Open `http://localhost:3000/auth`
3. Create a new email/password account
4. Confirm the session email appears
5. Sign out
6. Sign in again
7. Check Supabase dashboard tables: `users`, `profiles`
```

- [ ] **Step 3: Run final verification commands**

Run: `cd frontend && npm run lint && npm run typecheck`
Expected: PASS

- [ ] **Step 4: Manual browser verification**

Expected:
- Sign-up succeeds without email confirmation
- Sign-in succeeds
- Sign-out clears the session label
- `users` row exists with `auth_user_id`
- `profiles` row exists for the new app user

- [ ] **Step 5: Commit**

```bash
git add frontend/README.md docs/supabase-setup.md
git commit -m "docs: add nextjs auth verification steps"
```
