import { NextResponse } from "next/server";

type ApiErrorOptions = {
  status?: number;
};

function resolveErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류";
}

function inferErrorStatus(message: string) {
  if (
    message.includes("필수") ||
    message.includes("유형") ||
    message.includes("링크") ||
    message.includes("ID") ||
    message.includes("역할") ||
    message.includes("모집")
  ) {
    return 400;
  }

  if (message.includes("로그인이 필요")) {
    return 401;
  }

  if (message.includes("권한")) {
    return 403;
  }

  if (message.includes("찾을 수 없습니다.")) {
    return 404;
  }

  if (
    message.includes("이미") ||
    message.includes("중복") ||
    message.includes("자신의 프로젝트")
  ) {
    return 409;
  }

  return 500;
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function apiCreated<T>(data: T) {
  return apiOk(data, { status: 201 });
}

export function apiError(message: string, options?: ApiErrorOptions) {
  return NextResponse.json(
    { success: false, message },
    { status: options?.status ?? 500 }
  );
}

export function apiUnauthorized(message = "로그인이 필요합니다.") {
  return apiError(message, { status: 401 });
}

export function apiNotFound(message: string) {
  return apiError(message, { status: 404 });
}

export function apiErrorFromUnknown(error: unknown, status?: number) {
  const message = resolveErrorMessage(error);

  return apiError(message, { status: status ?? inferErrorStatus(message) });
}
