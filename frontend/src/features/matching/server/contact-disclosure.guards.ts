import { AppError } from "../../../lib/api/error.ts";

export type MatchRelationStatus =
  | "ACCEPTED"
  | "PENDING"
  | "REJECTED"
  | "CANCELED"
  | "CANCELLED"
  | null;

export function assertContactDisclosureAllowed(relationStatus: MatchRelationStatus) {
  if (relationStatus !== "ACCEPTED") {
    throw new AppError(
      "FORBIDDEN",
      "수락된 지원 또는 제안 후에만 연락처를 확인할 수 있습니다.",
    );
  }
}
