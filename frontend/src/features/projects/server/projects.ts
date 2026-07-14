import "server-only";

import { getCurrentAppUser } from "@/features/auth/server/current-app-user";
import { AppError } from "@/lib/api/error";

import { listMyProjectsForUser } from "./projects.mapper";
import {
  normalizeProjectPayload,
  type ProjectFormValues,
} from "./projects.payload";
import { projectRepository } from "./projects.repository";
import { validateProjectPayload } from "./projects.validation";

export type { ProjectFormValues };
export { normalizeProjectPayload, validateProjectPayload };

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
  projectStatus: string;
  campus: string;
  requiredRoles: string[];
  tools: string[];
  expectedMemberCount: number | null;
  startDate: string | null;
  endDate: string | null;
  recruitmentDeadline: string | null;
  createdAt: string;
  coverImageName: string | null;
  owner: {
    userId: number;
    email: string;
    name: string | null;
    department: string;
  };
};

export async function listProjects(filters: ProjectListFilters) {
  const currentUser = await getCurrentAppUser();

  return projectRepository.list(filters, currentUser?.id ?? null);
}

export async function listMyProjectsForSession() {
  const currentUser = await getCurrentAppUser();
  return listMyProjectsForUser(currentUser, (ownerUserId) =>
    projectRepository.listMine(ownerUserId),
  );
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
