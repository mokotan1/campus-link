import { bootstrapUser } from "@/features/auth/server/bootstrap-user";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { apiErrorFromUnknown, apiOk, apiUnauthorized } from "@/lib/api/response";

function isAuthSessionError(error: Error) {
  return /session|jwt|token|unauthorized/i.test(error.message);
}

export async function POST() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (isAuthSessionError(error)) {
        return apiUnauthorized();
      }

      throw new Error(error.message);
    }

    if (!user?.email) {
      return apiUnauthorized();
    }

    const result = await bootstrapUser({
      authUserId: user.id,
      email: user.email,
    });

    return apiOk(result);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
