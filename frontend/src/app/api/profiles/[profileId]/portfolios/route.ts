import { listPortfoliosByProfileId } from "@/features/portfolios/server/portfolios";
import { apiErrorFromUnknown, apiNotFound, apiOk } from "@/lib/api/response";

type RouteContext = {
  params: Promise<{
    profileId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { profileId } = await context.params;
    const portfolios = await listPortfoliosByProfileId(Number(profileId));

    if (!portfolios) {
      return apiNotFound("프로필을 찾을 수 없습니다.");
    }

    return apiOk(portfolios);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
