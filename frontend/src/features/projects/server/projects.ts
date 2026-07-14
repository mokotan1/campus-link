import "server-only";

import { getCurrentAppUser } from "@/features/auth/server/current-app-user";
import { AppError } from "@/lib/api/error";

import { validateProjectDates } from "./projects.guards";
import { projectRepository } from "./projects.repository";

export type ProjectFormValues = {
  title: string;
  summary: string;
  description: string;
  projectType: string;
  collaborationMode: string;
  recruitmentStatus: "RECRUITING" | "CLOSED";
  campus: string;
  requiredRoles: string[];
  tools: string[];
  expectedMemberCount: number | null;
  startDate: string;
  endDate: string;
  coverImageName: string;
};

export type ProjectListFilters = {
  query: string;
  campus: string;
  role: string;
  status: string;
};

export type ProjectRecord = {
  id: number;
  title: string;
  summary: string;
  description: string;
  projectType: string;
  collaborationMode: string;
  recruitmentStatus: string;
  campus: string;
  requiredRoles: string[];
  tools: string[];
  expectedMemberCount: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  coverImageName: string | null;
  owner: {
    userId: number;
    email: string;
    name: string | null;
    department: string;
  };
};

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

export function normalizeProjectPayload(body: unknown): ProjectFormValues {
  const payload = (body ?? {}) as Record<string, unknown>;
  const recruitmentStatus =
    payload.recruitmentStatus === "CLOSED" ? "CLOSED" : "RECRUITING";
  const rawExpectedMemberCount = Number(payload.expectedMemberCount);
  const expectedMemberCount = Number.isFinite(rawExpectedMemberCount)
    ? rawExpectedMemberCount
    : null;

  return {
    title: String(payload.title ?? "").trim(),
    summary: String(payload.summary ?? "").trim(),
    description: String(payload.description ?? "").trim(),
    projectType: String(payload.projectType ?? "").trim(),
    collaborationMode: String(payload.collaborationMode ?? "").trim(),
    recruitmentStatus,
    campus: String(payload.campus ?? "").trim(),
    requiredRoles: toStringArray(payload.requiredRoles),
    tools: toStringArray(payload.tools),
    expectedMemberCount,
    startDate: String(payload.startDate ?? "").trim(),
    endDate: String(payload.endDate ?? "").trim(),
    coverImageName: String(payload.coverImageName ?? "").trim().slice(0, 255),
  };
}

export function validateProjectPayload(values: ProjectFormValues) {
  if (!values.title) {
    throw new AppError("VALIDATION_ERROR", "프로젝트 제목은 필수입니다.");
  }

  if (!values.summary) {
    throw new AppError("VALIDATION_ERROR", "프로젝트 한 줄 소개는 필수입니다.");
  }

  if (!values.projectType) {
    throw new AppError("VALIDATION_ERROR", "프로젝트 유형은 필수입니다.");
  }

  if (!values.collaborationMode) {
    throw new AppError("VALIDATION_ERROR", "협업 방식은 필수입니다.");
  }

  validateProjectDates(values);
}

export async function listProjects(filters: ProjectListFilters) {
  const currentUser = await getCurrentAppUser();

  return projectRepository.list(filters, currentUser?.id ?? null);
}

export async function getProjectById(projectId: number) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new AppError("VALIDATION_ERROR", "올바른 프로젝트 ID가 필요합니다.");
  }

  const currentUser = await getCurrentAppUser();

  return projectRepository.findById(projectId, currentUser?.id ?? null);
}

export async function createProject(values: ProjectFormValues) {
  validateProjectPayload(values);

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return projectRepository.create(currentUser.id, values);
}

export async function updateProject(projectId: number, values: ProjectFormValues) {
  validateProjectPayload(values);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new AppError("VALIDATION_ERROR", "올바른 프로젝트 ID가 필요합니다.");
  }

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const ownerUserId = await projectRepository.findOwnerUserId(projectId);

  if (ownerUserId === null) {
    throw new AppError("NOT_FOUND", "프로젝트를 찾을 수 없습니다.");
  }

  if (ownerUserId !== currentUser.id) {
    throw new AppError("FORBIDDEN", "본인이 등록한 프로젝트만 수정할 권한이 있습니다.");
  }

  return projectRepository.update(projectId, currentUser.id, values);
}
