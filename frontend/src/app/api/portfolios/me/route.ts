import { listMyPortfolios } from "@/features/portfolios/server/portfolios";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

export async function GET() {
  try {
    const portfolios = await listMyPortfolios();

    if (!portfolios) {
      return apiUnauthorized();
    }

    return apiOk(portfolios);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
