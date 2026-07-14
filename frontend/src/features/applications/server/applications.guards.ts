import { AppError, INTERNAL_ERROR_MESSAGE } from "../../../lib/api/error.ts";

import type { CurrentAppUser } from "../../auth/server/current-app-user.mapper.ts";
import {
  assertRecruitmentOpen,
  type RecruitmentGateProject,
} from "../../matching/server/recruitment-eligibility.ts";

type ProjectSummary = {
  owner_user_id: number;
} & RecruitmentGateProject;

export type ApplicationDetailRow = {
  id: number;
  project_id: number;
  applicant_user_id: number;
  message: string | null;
  application_status: string;
  target_role: string | null;
  created_at: string;
};

export function assertCanApplyToProject(
  currentUser: CurrentAppUser,
  project: ProjectSummary,
  today: string,
) {
  if (project.owner_user_id === currentUser.id) {
    throw new AppError("FORBIDDEN", "자신의 프로젝트에는 지원할 수 없습니다.");
  }

  assertRecruitmentOpen(project, today);
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

export function assertApplicationTransitionResult(
  value: unknown,
  applicationId: number,
  expectedStatus: "ACCEPTED" | "REJECTED" | "CANCELED",
): ApplicationDetailRow {
  if (value == null || Array.isArray(value) || typeof value !== "object") {
    throw new AppError("INTERNAL_ERROR", INTERNAL_ERROR_MESSAGE);
  }

  const row = value as Record<string, unknown>;

  if (row.id !== applicationId || row.application_status !== expectedStatus) {
    throw new AppError("INTERNAL_ERROR", INTERNAL_ERROR_MESSAGE);
  }

  return value as ApplicationDetailRow;
}
