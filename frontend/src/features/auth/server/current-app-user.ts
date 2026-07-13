import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

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
    throw new Error("현재 사용자를 확인하지 못했습니다.");
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
    throw new Error("사용자 정보를 확인하지 못했습니다.");
  }

  return (appUser as AppUserRecord | null) ?? null;
}
