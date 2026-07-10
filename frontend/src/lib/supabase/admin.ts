import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabaseServerEnv } from "./env";

/**
 * Service-role Supabase client. Bypasses RLS — use only in bootstrap/maintenance
 * modules where the caller has no app-user row yet or privileged writes are required.
 * See `bootstrap-user.ts` for the documented production use case.
 */
export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServerEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
