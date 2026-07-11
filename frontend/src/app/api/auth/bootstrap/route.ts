import { isSchoolEmail, schoolEmailMessage } from "@/features/auth/lib/school-email";
import { bootstrapUser } from "@/features/auth/server/bootstrap-user";
import { apiError, apiErrorFromUnknown, apiOk, apiUnauthorized } from "@/lib/api/response";
import { createClient as createServerClient } from "@/lib/supabase/server";

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

    if (!isSchoolEmail(user.email)) {
      return apiError(schoolEmailMessage(), { status: 400 });
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
