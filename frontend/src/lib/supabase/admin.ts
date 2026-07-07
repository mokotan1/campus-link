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
