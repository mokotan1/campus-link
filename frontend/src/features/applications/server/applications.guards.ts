import { AppError } from "../../../lib/api/error.ts";
import { assertProjectAcceptingNewParticipants } from "../../projects/server/projects.guards.ts";

import type { CurrentAppUser } from "../../auth/server/current-app-user.mapper.ts";

type ProjectSummary = {
  owner_user_id: number;
  recruitment_status: string;
  end_date: string | null;
};

export function assertCanApplyToProject(currentUser: CurrentAppUser, project: ProjectSummary) {
  if (project.owner_user_id === currentUser.id) {
    throw new AppError("FORBIDDEN", "자신의 프로젝트에는 지원할 수 없습니다.");
  }

  assertProjectAcceptingNewParticipants(project);
}

export function assertNoDuplicateApplication(existing: { id: number } | null) {
  if (existing) {
    throw new AppError("DUPLICATE_RESOURCE", "이미 이 프로젝트에 지원했습니다.");
  }
}

export function assertProjectOwnerForApplicationDecision(
  currentUser: CurrentAppUser,
  ownerUserId: number,
) {
  if (currentUser.id !== ownerUserId) {
    throw new AppError("FORBIDDEN", "프로젝트 소유자만 지원을 수락하거나 거절할 수 있습니다.");
  }
}

export function assertApplicantForWithdraw(
  currentUser: CurrentAppUser,
  applicantUserId: number,
) {
  if (currentUser.id !== applicantUserId) {
    throw new AppError("FORBIDDEN", "본인의 지원만 철회할 수 있습니다.");
  }
}

export function assertPendingApplicationStatus(status: string) {
  if (status !== "PENDING") {
    throw new AppError(
      "INVALID_STATE_TRANSITION",
      "대기 중인 지원만 처리할 수 있습니다.",
    );
  }
}
