type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Array<{ field: string; message: string }>;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export async function readApiResponse<T>(response: Response) {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "요청에 실패했습니다." : payload.error.message);
  }

  return payload.data;
}

export type SaveState = {
  isSaving: boolean;
  error: string | null;
};

export const idleSaveState: SaveState = { isSaving: false, error: null };
