import "server-only";

import { createClient as createServerClient } from "@/lib/supabase/server";

import { isAuthSessionError } from "./auth-session-error";
import { toAppUser, type CurrentAppUser } from "./current-app-user.mapper";

export { toAppUser, type AppUserRow, type CurrentAppUser } from "./current-app-user.mapper";

/**
 * Resolves the caller's application identity from the Supabase session.
 *
 * This uses the session-bound server client ONLY: identity resolution must
 * never rely on the service-role client, because that would bypass RLS and
 * could be tricked into resolving an identity the caller does not hold a
 * valid session for.
 *
 * Every server module that needs the caller's identity should go through this
 * function rather than trusting a client-supplied user id. The mapping from
 * `auth.uid()` to bigint `public.users.id` is enforced by `toAppUser()`.
 */
export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
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
