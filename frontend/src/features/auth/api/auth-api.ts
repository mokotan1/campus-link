type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  message: string;
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type BootstrapResult = {
  appUserId: number;
};

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "요청에 실패했습니다." : payload.message);
  }

  return payload.data;
}

export async function bootstrapAppUserClient(): Promise<void> {
  const response = await fetch("/api/auth/bootstrap", {
    method: "POST",
  });

  await readApiResponse<BootstrapResult>(response);
}
