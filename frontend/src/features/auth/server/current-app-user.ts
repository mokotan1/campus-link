/**
 * The single, documented mapping from a Supabase Auth subject to the
 * existing bigint `public.users.id`. Every server module that needs the
 * caller's identity should go through `getCurrentAppUser()` rather than
 * trusting a client-supplied user id.
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
 *
 * This is a pure function (no I/O, no framework dependency) so it can be
 * unit-tested directly, independent of the Next.js/Supabase runtime.
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

/**
 * Resolves the caller's application identity from the Supabase session.
 *
 * This uses the session-bound server client ONLY: identity resolution must
 * never rely on the service-role client, because that would bypass RLS and
 * could be tricked into resolving an identity the caller does not hold a
 * valid session for.
 *
 * The Next.js/Supabase server client modules (and the `server-only` guard)
 * are imported dynamically here, instead of as static top-level imports, so
 * that the pure `toAppUser` helper above stays importable and unit-testable
 * outside the Next.js request runtime, e.g. via plain `node --test`.
 */
export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  const [, { createClient: createServerClient }, { isAuthSessionError }] = await Promise.all([
    import("server-only"),
    import("@/lib/supabase/server"),
    import("./auth-session-error"),
  ]);

  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isAuthSessionError(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  if (!user) {
    return null;
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, auth_user_id, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (appUserError) {
    throw new Error(appUserError.message);
  }

  if (!appUser) {
    return null;
  }

  return toAppUser(appUser, user.id);
}
