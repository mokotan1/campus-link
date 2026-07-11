import { listRecommendedTalents } from "@/features/recommendations/server/talents";
import { apiErrorFromUnknown, apiOk } from "@/lib/api/response";

export async function GET() {
  try {
    const talents = await listRecommendedTalents();
    return apiOk(talents);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
