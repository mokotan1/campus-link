import { AppError } from "../../../lib/api/error.ts";
import { assertProjectAcceptingNewParticipants } from "../../projects/server/projects.guards.ts";

import type { CurrentAppUser } from "../../auth/server/current-app-user.mapper.ts";

type ProjectSummary = {
  owner_user_id: number;
  recruitment_status: string;
  end_date: string | null;
};

export function assertProjectOwnerForProposal(
  currentUser: CurrentAppUser,
  project: ProjectSummary,
) {
  if (project.owner_user_id !== currentUser.id) {
    throw new AppError("FORBIDDEN", "프로젝트 소유자만 제안을 보낼 수 있습니다.");
  }

  assertProjectAcceptingNewParticipants(project);
}

export function assertDistinctProposalUsers(
  currentUser: CurrentAppUser,
  receiverUserId: number,
) {
  if (currentUser.id === receiverUserId) {
    throw new AppError("FORBIDDEN", "자신에게는 제안을 보낼 수 없습니다.");
  }
}

export function assertProposalMessage(message: string) {
  if (!message.trim()) {
    throw new AppError("VALIDATION_ERROR", "제안 메시지는 필수입니다.");
  }
}

export function assertNoDuplicateProposal(existing: { id: number } | null) {
  if (existing) {
    throw new AppError("DUPLICATE_RESOURCE", "이미 이 사용자에게 제안을 보냈습니다.");
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
