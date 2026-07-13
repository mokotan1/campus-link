const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseEnv() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  return { url: supabaseUrl, publishableKey: supabasePublishableKey };
}

export function getSupabaseServerEnv() {
  if (!supabaseUrl || !supabasePublishableKey || !supabaseServiceRoleKey) {
    throw new Error("Supabase 서버 환경 변수가 설정되지 않았습니다.");
  }

  return { url: supabaseUrl, publishableKey: supabasePublishableKey, serviceRoleKey: supabaseServiceRoleKey };
}
