/**
 * Pure auth-to-app-user mapping types and invariants.
 *
 * This module has no server/framework dependencies so it can be unit-tested
 * directly via `node --test` without pulling in Next.js or Supabase clients.
 */
export type CurrentAppUser = {
  id: number;
  authUserId: string;
  email: string;
};

export type AppUserRow = {
  id: number;
  auth_user_id: string | null;
  email: string | null;
};

const UNAUTHORIZED = "UNAUTHORIZED";

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
    throw new Error(`${UNAUTHORIZED}: no app user is linked to the current session`);
  }

  if (!row.auth_user_id) {
    throw new Error(`${UNAUTHORIZED}: app user record is not linked to a Supabase Auth subject`);
  }

  if (expectedAuthUserId && row.auth_user_id !== expectedAuthUserId) {
    throw new Error(`${UNAUTHORIZED}: app user record does not belong to the authenticated session`);
  }

  if (!row.email) {
    throw new Error(`${UNAUTHORIZED}: app user record is missing an email`);
  }

  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email,
  };
}
