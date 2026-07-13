import { AppError } from "@/lib/api/error";

const RPC_ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND_OR_FORBIDDEN",
  "INVALID_DECISION",
  "INVALID_TRANSITION",
  "VALIDATION_ERROR",
] as const;

type RpcErrorCode = (typeof RPC_ERROR_CODES)[number];

function extractRpcErrorCode(message: string): RpcErrorCode | null {
  for (const code of RPC_ERROR_CODES) {
    if (message.includes(code)) {
      return code;
    }
  }

  return null;
}

export function throwAppErrorFromRpc(
  error: { message?: string },
  messages: Partial<Record<RpcErrorCode, string>> = {},
) {
  const message = error.message ?? "";
  const code = extractRpcErrorCode(message);

  switch (code) {
    case "UNAUTHORIZED":
      throw new AppError("UNAUTHORIZED", messages.UNAUTHORIZED ?? "로그인이 필요합니다.");
    case "NOT_FOUND_OR_FORBIDDEN":
      throw new AppError(
        "FORBIDDEN",
        messages.NOT_FOUND_OR_FORBIDDEN ?? "요청을 처리할 권한이 없습니다.",
      );
    case "INVALID_DECISION":
    case "INVALID_TRANSITION":
      throw new AppError(
        "INVALID_STATE_TRANSITION",
        messages[code] ?? "현재 상태에서는 이 작업을 수행할 수 없습니다.",
      );
    case "VALIDATION_ERROR":
      throw new AppError(
        "VALIDATION_ERROR",
        messages.VALIDATION_ERROR ?? "요청 값이 올바르지 않습니다.",
      );
    case "FORBIDDEN":
      throw new AppError("FORBIDDEN", messages.FORBIDDEN ?? "접근 권한이 없습니다.");
    default:
      throw new Error(message || "Supabase RPC failed");
  }
}
