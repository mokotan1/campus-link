import { listProfileRecommendationsForSession } from "@/features/recommendations/server/recommendations";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = Number(searchParams.get("projectId"));

    const recommendations = await listProfileRecommendationsForSession(projectId);

    if (!recommendations) {
      return apiUnauthorized();
    }

    return apiOk(recommendations);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
