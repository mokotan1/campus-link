import type { PortfolioFormValues, PortfolioRecord } from "@/features/portfolios/types";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  message: string;
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "요청에 실패했습니다." : payload.message);
  }

  return payload.data;
}

export async function listMyPortfoliosClient(): Promise<PortfolioRecord[]> {
  const response = await fetch("/api/portfolios", {
    method: "GET",
    cache: "no-store",
  });

  return readApiResponse<PortfolioRecord[]>(response);
}

export async function savePortfolioClient(input: PortfolioFormValues): Promise<PortfolioRecord> {
  const response = await fetch("/api/portfolios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readApiResponse<PortfolioRecord>(response);
}
