import { AppError, INTERNAL_ERROR_MESSAGE } from "./error.ts";

export type ApiErrorBody = {
  code: AppError["code"];
  message: string;
  fields?: Array<{ field: string; message: string }>;
};

function formatErrorBody(error: AppError): ApiErrorBody {
  return {
    code: error.code,
    message: error.message,
    ...(error.fields ? { fields: error.fields } : {}),
  };
}

export function resolveApiError(error: unknown): {
  status: number;
  body: { success: false; error: ApiErrorBody };
} {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: { success: false, error: formatErrorBody(error) },
    };
  }

  console.error(error);

  return {
    status: 500,
    body: {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: INTERNAL_ERROR_MESSAGE,
      },
    },
  };
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, init);
}

export function apiCreated<T>(data: T) {
  return apiOk(data, { status: 201 });
}

export function apiError(error: AppError) {
  const resolved = resolveApiError(error);
  return Response.json(resolved.body, { status: resolved.status });
}

export function apiUnauthorized(message = "로그인이 필요합니다.") {
  return apiError(new AppError("UNAUTHORIZED", message));
}

export function apiNotFound(message: string) {
  return apiError(new AppError("NOT_FOUND", message));
}

export function apiErrorFromUnknown(error: unknown) {
  const resolved = resolveApiError(error);
  return Response.json(resolved.body, { status: resolved.status });
}
