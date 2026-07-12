import "server-only";

import { isSchoolEmail } from "@/features/auth/lib/school-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export type AppUserRecord = {
  id: number;
  profileId: number | null;
  authUserId: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  schoolEmail: boolean;
};

function isAuthSessionErrorMessage(message: string) {
  return /session|jwt|token|unauthorized/i.test(message);
}

export async function getCurrentAppUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isAuthSessionErrorMessage(error.message)) {
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
    .select("id, auth_user_id, email, name, email_verified")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (appUserError) {
    throw new Error(appUserError.message);
  }

  if (!appUser) {
    return null;
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", appUser.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    id: appUser.id,
    profileId: profile?.id ?? null,
    authUserId: appUser.auth_user_id,
    email: appUser.email,
    name: appUser.name,
    emailVerified: Boolean(user.email_confirmed_at || appUser.email_verified),
    schoolEmail: isSchoolEmail(appUser.email),
  } satisfies AppUserRecord;
}
