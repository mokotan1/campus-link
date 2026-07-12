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

export type CurrentAppUser = {
  id: number;
  profileId: number | null;
  authUserId: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  schoolEmail: boolean;
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

export async function getCurrentAppUserClient(): Promise<CurrentAppUser> {
  const readCurrentUser = async () => {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
    });

    return readApiResponse<CurrentAppUser>(response);
  };

  try {
    return await readCurrentUser();
  } catch (error) {
    const message = error instanceof Error ? error.message : "현재 사용자 정보를 확인하지 못했습니다.";

    if (!message.includes("로그인이 필요") && !message.includes("Auth session missing")) {
      throw error;
    }

    await bootstrapAppUserClient();
    return readCurrentUser();
  }
}
