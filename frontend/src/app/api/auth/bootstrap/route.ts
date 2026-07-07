import { bootstrapUser } from "@/features/auth/server/bootstrap-user";
import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authUserId = String(body.authUserId ?? "").trim();
    const email = String(body.email ?? "").trim();

    if (!authUserId || !email) {
      return apiError("authUserId와 email이 필요합니다.", { status: 400 });
    }

    const result = await bootstrapUser({ authUserId, email });

    return apiOk(result);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
