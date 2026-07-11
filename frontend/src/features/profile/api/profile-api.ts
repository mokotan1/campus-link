import type { ProfileFormValues, ProfileRecord } from "@/features/profile/types";

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

export async function getMyProfileClient(): Promise<ProfileRecord> {
  const response = await fetch("/api/profiles/me", {
    method: "GET",
    cache: "no-store",
  });

  return readApiResponse<ProfileRecord>(response);
}

export async function createMyProfileClient(input: ProfileFormValues): Promise<ProfileRecord> {
  const response = await fetch("/api/profiles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readApiResponse<ProfileRecord>(response);
}

export async function updateMyProfileClient(input: ProfileFormValues): Promise<ProfileRecord> {
  const response = await fetch("/api/profiles/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readApiResponse<ProfileRecord>(response);
}
