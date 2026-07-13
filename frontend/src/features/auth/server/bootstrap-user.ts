import "server-only";

import { isSchoolEmail, schoolEmailMessage } from "@/features/auth/lib/school-email";
import { createAdminClient } from "@/lib/supabase/admin";

export type BootstrapPayload = {
  authUserId: string;
  email: string;
  emailVerified: boolean;
};

export async function bootstrapUser({ authUserId, email, emailVerified }: BootstrapPayload) {
  if (!isSchoolEmail(email)) {
    throw new Error(schoolEmailMessage());
  }

  const supabase = createAdminClient();
  const fallbackName = email.split("@")[0] || "new-user";

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
        name: fallbackName,
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

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", appUserId)
    .maybeSingle();

  if (existingProfileError) {
    throw new Error(existingProfileError.message);
  }

  if (!existingProfile) {
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: appUserId,
      collaboration_status: "OPEN",
    });

    if (profileError) {
      throw new Error(profileError.message);
    }
  }

  return { appUserId };
}
