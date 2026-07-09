import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

import { isAuthSessionError } from "./auth-session-error";

export type AppUserRecord = {
  id: number;
  email: string;
  name: string | null;
};

export async function getCurrentAppUser() {
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

  const admin = createAdminClient();
  const { data: appUser, error: appUserError } = await admin
    .from("users")
    .select("id, email, name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (appUserError) {
    throw new Error(appUserError.message);
  }

  if (!appUser) {
    return null;
  }

  return appUser satisfies AppUserRecord;
}
