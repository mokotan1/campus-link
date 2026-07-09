const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseEnv = {
  url: supabaseUrl ?? "",
  publishableKey: supabasePublishableKey ?? "",
};

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabaseEnv() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase environment variables are missing. Check frontend/.env.local."
    );
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
  };
}

export function getSupabaseServerEnv() {
  if (!supabaseUrl || !supabasePublishableKey || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase server environment variables are missing. Check frontend/.env.local."
    );
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
    serviceRoleKey: supabaseServiceRoleKey,
  };
}
