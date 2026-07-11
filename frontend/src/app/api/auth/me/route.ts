import { getCurrentAppUser } from "@/features/auth/server/current-app-user";
import { apiErrorFromUnknown, apiOk, apiUnauthorized } from "@/lib/api/response";

export async function GET() {
  try {
    const appUser = await getCurrentAppUser();

    if (!appUser) {
      return apiUnauthorized();
    }

    return apiOk(appUser);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
