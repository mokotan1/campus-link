import {
  createPortfolio,
  listMyPortfolios,
  normalizePortfolioPayload,
} from "@/features/portfolios/server/portfolios";
import {
  apiCreated,
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const values = normalizePortfolioPayload(body);
    const portfolio = await createPortfolio(values);

    if (!portfolio) {
      return apiUnauthorized();
    }

    return apiCreated(portfolio);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
