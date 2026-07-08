import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type BootstrapPayload = {
  authUserId: string;
  email: string;
  emailVerified: boolean;
};

export async function bootstrapUser({ authUserId, email, emailVerified }: BootstrapPayload) {
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
        email_verified: emailVerified,
      })
      .select("id")
      .single();

    if (insertUserError) {
      throw new Error(insertUserError.message);
    }

    appUserId = insertedUser.id;
  } else {
    const { error: updateUserError } = await supabase
      .from("users")
      .update({ email_verified: emailVerified })
      .eq("id", appUserId);

    if (updateUserError) {
      throw new Error(updateUserError.message);
    }
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
