import { listProjectRecommendationsForSession } from "@/features/recommendations/server/recommendations";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

export async function GET() {
  try {
    const recommendations = await listProjectRecommendationsForSession();

    if (!recommendations) {
      return apiUnauthorized();
    }

    return apiOk(recommendations);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
