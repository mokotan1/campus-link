import { AppError } from "../../../lib/api/error.ts";

/**
 * Pure auth-to-app-user mapping types and invariants.
 *
 * This module has no server/framework dependencies so it can be unit-tested
 * directly via `node --test` without pulling in Next.js or Supabase clients.
 */
export type CurrentAppUser = {  id: number;
  authUserId: string;
  email: string;
};

export type AppUserRow = {
  id: number;
  auth_user_id: string | null;
  email: string | null;
};

/**
 * Maps a raw `public.users` row to a `CurrentAppUser`, enforcing the
 * auth-to-app-user link as an invariant rather than assuming the caller's
 * query already guaranteed it. Throws `UNAUTHORIZED` when:
 *  - no row was found for the session,
 *  - the row is not linked to any Supabase Auth subject,
 *  - the row is linked to a different subject than the current session, or
 *  - the row is missing required identity data (email).
 */
export function toAppUser(row: AppUserRow | null | undefined, expectedAuthUserId?: string): CurrentAppUser {
  if (!row) {
    throw new AppError("UNAUTHORIZED", "로그인이 필요합니다.");
  }

  if (!row.auth_user_id) {
    throw new AppError("UNAUTHORIZED", "로그인이 필요합니다.");
  }

  if (expectedAuthUserId && row.auth_user_id !== expectedAuthUserId) {
    throw new AppError("UNAUTHORIZED", "로그인이 필요합니다.");
  }

  if (!row.email) {
    throw new AppError("UNAUTHORIZED", "로그인이 필요합니다.");
  }

  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email,
  };
}
