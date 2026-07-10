import { isSchoolEmail, schoolEmailMessage } from "@/features/auth/lib/school-email";
import { isAuthSessionError } from "@/features/auth/server/auth-session-error";
import { bootstrapUser } from "@/features/auth/server/bootstrap-user";
import { AppError } from "@/lib/api/error";
import { apiErrorFromUnknown, apiOk, apiUnauthorized } from "@/lib/api/response";
import { createClient as createServerClient } from "@/lib/supabase/server";

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
      throw new AppError("VALIDATION_ERROR", schoolEmailMessage());
    }

    const result = await bootstrapUser({
      authUserId: user.id,
      email: user.email,
      emailVerified: Boolean(user.email_confirmed_at),
    });

    return apiOk(result);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
