import { AppError } from "../../../lib/api/error.ts";

import type { CurrentAppUser } from "../../auth/server/current-app-user.mapper.ts";
import type { MatchingEligibility } from "../../matching/server/recruitment-eligibility.ts";

type ProjectOwnerSummary = {
  owner_user_id: number;
};

export function assertProjectOwnerForProposal(
  currentUser: CurrentAppUser,
  project: ProjectOwnerSummary,
) {
  if (project.owner_user_id !== currentUser.id) {
    throw new AppError("FORBIDDEN", "프로젝트 소유자만 제안을 보낼 수 있습니다.");
  }
}

export function assertDistinctProposalUsers(
  currentUser: CurrentAppUser,
  receiverUserId: number,
) {
  if (currentUser.id === receiverUserId) {
    throw new AppError("FORBIDDEN", "자신에게는 제안을 보낼 수 없습니다.");
  }
}

export function assertNoDuplicateProposal(existing: { id: number } | null) {
  if (existing) {
    throw new AppError("DUPLICATE_RESOURCE", "이미 이 사용자에게 제안을 보냈습니다.");
  }
}

export function assertProposalReceiverExists(
  profile: MatchingEligibility | null,
): asserts profile is MatchingEligibility {
  if (!profile) {
    throw new AppError("NOT_FOUND", "수신자를 찾을 수 없습니다.");
  }
}

export function assertReceiverForProposalDecision(
  currentUser: CurrentAppUser,
  receiverUserId: number,
) {
  if (currentUser.id !== receiverUserId) {
    throw new AppError("FORBIDDEN", "제안 수신자만 수락하거나 거절할 수 있습니다.");
  }
}

export function assertPendingProposalStatus(status: string) {
  if (status !== "PENDING") {
    throw new AppError(
      "INVALID_STATE_TRANSITION",
      "대기 중인 제안만 처리할 수 있습니다.",
    );
  }
}
