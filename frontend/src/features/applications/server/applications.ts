import "server-only";

import { getCurrentAppUser } from "@/features/auth/server/current-app-user";
import { AppError } from "@/lib/api/error";

import { applicationRepository } from "./applications.repository";

export type ApplicationFormValues = {
  projectId: number | null;
  message: string;
  targetRole: string;
};

export type MyApplicationRecord = {
  id: number;
  projectId: number;
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

export async function createApplication(values: ApplicationFormValues) {
  validateApplicationPayload(values);

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const project = await applicationRepository.findProjectSummary(values.projectId!);

  if (!project) {
    throw new AppError("NOT_FOUND", "프로젝트를 찾을 수 없습니다.");
  }

  if (project.owner_user_id === currentUser.id) {
    throw new AppError("FORBIDDEN", "자신의 프로젝트에는 지원할 수 없습니다.");
  }

  if (project.recruitment_status !== "RECRUITING") {
    throw new AppError(
      "INVALID_STATE_TRANSITION",
      "현재 모집 중인 프로젝트만 지원할 수 있습니다.",
    );
  }

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

  if (existing) {
    throw new AppError("DUPLICATE_RESOURCE", "이미 이 프로젝트에 지원했습니다.");
  }

  return applicationRepository.create(
    values.projectId!,
    currentUser.id,
    values.message,
    values.targetRole,
  );
}

export async function listMyApplications() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return applicationRepository.listByApplicant(currentUser.id);
}
