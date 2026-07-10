export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "DUPLICATE_RESOURCE"
  | "INVALID_STATE_TRANSITION"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

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
    return (
      {
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        VALIDATION_ERROR: 400,
        DUPLICATE_RESOURCE: 409,
        INVALID_STATE_TRANSITION: 409,
        RATE_LIMITED: 429,
        INTERNAL_ERROR: 500,
      } as const
    )[this.code];
  }
}

export const INTERNAL_ERROR_MESSAGE =
  "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
