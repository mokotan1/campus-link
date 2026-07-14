import "server-only";

import type { CurrentAppUser } from "@/features/auth/server/current-app-user.mapper";
import { getCurrentAppUser } from "@/features/auth/server/current-app-user";
import { AppError } from "@/lib/api/error";

import {
  assertApplicantForWithdraw,
  assertCanApplyToProject,
  assertNoDuplicateApplication,
  assertPendingApplicationStatus,
  assertProjectOwnerForApplicationDecision,
} from "./applications.guards";
import {
  applicationRepository,
  type MatchedContactDetails,
} from "./applications.repository";

export type ApplicationFormValues = {
  projectId: number | null;
  message: string;
  targetRole: string;
};

export type MyApplicationRecord = {
  id: number;
  projectId: number;
  direction: "sent" | "received";
  message: string;
  status: string;
  targetRole: string;
  createdAt: string;
  project: {
    title: string;
    campus: string;
    recruitmentStatus: string;
  };
};

export function normalizeApplicationPayload(body: unknown): ApplicationFormValues {
  const payload = (body ?? {}) as Record<string, unknown>;
  const rawProjectId = Number(payload.projectId);

  return {
    projectId: Number.isInteger(rawProjectId) ? rawProjectId : null,
    message: String(payload.message ?? "").trim(),
    targetRole: String(payload.targetRole ?? "").trim(),
  };
}

export function validateApplicationPayload(values: ApplicationFormValues) {
  if (!values.projectId || values.projectId <= 0) {
    throw new AppError("VALIDATION_ERROR", "올바른 프로젝트 ID가 필요합니다.");
  }

  if (!values.targetRole) {
    throw new AppError("VALIDATION_ERROR", "지원 역할은 필수입니다.");
  }
}

export async function createApplication(
  currentUser: CurrentAppUser,
  values: ApplicationFormValues,
) {
  validateApplicationPayload(values);

  const project = await applicationRepository.findProjectSummary(values.projectId!);

  if (!project) {
    throw new AppError("NOT_FOUND", "프로젝트를 찾을 수 없습니다.");
  }

  assertCanApplyToProject(currentUser, project);

  if (!(project.required_roles ?? []).includes(values.targetRole)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "프로젝트에 없는 역할로는 지원할 수 없습니다.",
    );
  }

  const existing = await applicationRepository.findExisting(
    values.projectId!,
    currentUser.id,
  );

  assertNoDuplicateApplication(existing);

  return applicationRepository.create(
    values.projectId!,
    currentUser.id,
    values.message,
    values.targetRole,
  );
}

export async function withdrawApplication(
  currentUser: CurrentAppUser,
  applicationId: number,
) {
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    throw new AppError("VALIDATION_ERROR", "올바른 지원 ID가 필요합니다.");
  }

  const application = await applicationRepository.findById(applicationId);

  if (!application) {
    throw new AppError("NOT_FOUND", "지원을 찾을 수 없습니다.");
  }

  assertApplicantForWithdraw(currentUser, application.applicant_user_id);
  assertPendingApplicationStatus(application.application_status);

  return applicationRepository.applicantWithdraw(applicationId);
}

export async function decideApplication(
  currentUser: CurrentAppUser,
  applicationId: number,
  decision: "ACCEPTED" | "REJECTED",
) {
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    throw new AppError("VALIDATION_ERROR", "올바른 지원 ID가 필요합니다.");
  }

  const application = await applicationRepository.findById(applicationId);

  if (!application) {
    throw new AppError("NOT_FOUND", "지원을 찾을 수 없습니다.");
  }

  const project = await applicationRepository.findProjectSummary(application.project_id);

  if (!project) {
    throw new AppError("NOT_FOUND", "프로젝트를 찾을 수 없습니다.");
  }

  assertProjectOwnerForApplicationDecision(currentUser, project.owner_user_id);
  assertPendingApplicationStatus(application.application_status);

  return applicationRepository.ownerDecide(applicationId, decision);
}

export async function getMatchedContactDetails(
  currentUser: CurrentAppUser,
  otherUserId: number,
): Promise<MatchedContactDetails> {
  if (!Number.isInteger(otherUserId) || otherUserId <= 0) {
    throw new AppError("VALIDATION_ERROR", "올바른 사용자 ID가 필요합니다.");
  }

  if (otherUserId === currentUser.id) {
    throw new AppError("VALIDATION_ERROR", "본인 연락처는 이 API로 조회할 수 없습니다.");
  }

  const contact = await applicationRepository.getMatchedContactDetails(otherUserId);

  if (!contact) {
    throw new AppError(
      "FORBIDDEN",
      "수락된 지원 또는 제안 후에만 연락처를 확인할 수 있습니다.",
    );
  }

  return contact;
}

export async function listMyApplications() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const [sentApplications, receivedApplications] = await Promise.all([
    applicationRepository.listByApplicant(currentUser.id),
    applicationRepository.listByProjectOwner(currentUser.id),
  ]);

  return [...sentApplications, ...receivedApplications].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export async function createApplicationForSession(values: ApplicationFormValues) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return createApplication(currentUser, values);
}

export async function withdrawApplicationForSession(applicationId: number) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return withdrawApplication(currentUser, applicationId);
}

export async function decideApplicationForSession(
  applicationId: number,
  decision: "ACCEPTED" | "REJECTED",
) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return decideApplication(currentUser, applicationId, decision);
}

