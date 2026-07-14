export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "DUPLICATE_RESOURCE"
  | "INVALID_STATE_TRANSITION"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const APP_ERROR_CODES = new Set<AppErrorCode>([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "DUPLICATE_RESOURCE",
  "INVALID_STATE_TRANSITION",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
]);

const APP_ERROR_STATUS: Record<AppErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  DUPLICATE_RESOURCE: 409,
  INVALID_STATE_TRANSITION: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly fields?: Array<{ field: string; message: string }>;

  constructor(
    code: AppErrorCode,
    message: string,
    fields?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fields = fields;
  }

  get status() {
    return APP_ERROR_STATUS[this.code];
  }
}

/**
 * Recognizes AppError across duplicated module instances.
 * Next may evaluate `@/lib/api/error` and relative `error.ts` as separate
 * module copies, which breaks `instanceof` while leaving name/code intact.
 */
export function isAppError(error: unknown): error is AppError {
  if (error instanceof AppError) {
    return true;
  }

  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { name?: unknown; code?: unknown; message?: unknown };
  return (
    candidate.name === "AppError" &&
    typeof candidate.code === "string" &&
    APP_ERROR_CODES.has(candidate.code as AppErrorCode) &&
    typeof candidate.message === "string"
  );
}

export function getAppErrorStatus(error: AppError): number {
  return APP_ERROR_STATUS[error.code];
}

export const INTERNAL_ERROR_MESSAGE =
  "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
