import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/features/auth/server/current-app-user";

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

type ApplicationRow = {
  id: number;
  project_id: number;
  applicant_user_id: number;
  message: string | null;
  application_status: string;
  target_role: string | null;
  created_at: string;
};

type ProjectSummaryRow = {
  id: number;
  owner_user_id: number;
  title: string;
  campus: string | null;
  recruitment_status: string;
  required_roles: string[] | null;
};

function mapApplicationRow(
  row: ApplicationRow,
  projectMap: Map<number, ProjectSummaryRow>
) {
  const project = projectMap.get(row.project_id);

  return {
    id: row.id,
    projectId: row.project_id,
    message: row.message ?? "",
    status: row.application_status,
    targetRole: row.target_role ?? "",
    createdAt: row.created_at,
    project: {
      title: project?.title ?? "",
      campus: project?.campus ?? "",
      recruitmentStatus: project?.recruitment_status ?? "",
    },
  } satisfies MyApplicationRecord;
}

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
    throw new Error("올바른 프로젝트 ID가 필요합니다.");
  }

  if (!values.targetRole) {
    throw new Error("지원 역할은 필수입니다.");
  }
}

async function getProjectSummary(projectId: number) {
  const admin = createAdminClient();
  const { data: project, error } = await admin
    .from("projects")
    .select("id, owner_user_id, title, campus, recruitment_status, required_roles")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (project as ProjectSummaryRow | null) ?? null;
}

export async function createApplication(values: ApplicationFormValues) {
  validateApplicationPayload(values);

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const project = await getProjectSummary(values.projectId!);

  if (!project) {
    throw new Error("프로젝트를 찾을 수 없습니다.");
  }

  if (project.owner_user_id === currentUser.id) {
    throw new Error("자신의 프로젝트에는 지원할 수 없습니다.");
  }

  if (project.recruitment_status !== "RECRUITING") {
    throw new Error("현재 모집 중인 프로젝트만 지원할 수 있습니다.");
  }

  if (!(project.required_roles ?? []).includes(values.targetRole)) {
    throw new Error("프로젝트에 없는 역할로는 지원할 수 없습니다.");
  }

  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("applications")
    .select("id")
    .eq("project_id", values.projectId!)
    .eq("applicant_user_id", currentUser.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    throw new Error("이미 이 프로젝트에 지원했습니다.");
  }

  const { data: application, error } = await admin
    .from("applications")
    .insert({
      project_id: values.projectId!,
      applicant_user_id: currentUser.id,
      message: values.message || null,
      application_status: "PENDING",
      target_role: values.targetRole,
    })
    .select("id, project_id, applicant_user_id, message, application_status, target_role, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapApplicationRow(application as ApplicationRow, new Map([[project.id, project]]));
}

export async function listMyApplications() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const admin = createAdminClient();
  const { data: applications, error } = await admin
    .from("applications")
    .select("id, project_id, applicant_user_id, message, application_status, target_role, created_at")
    .eq("applicant_user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const projectIds = [...new Set((applications ?? []).map((item) => item.project_id))];

  if (projectIds.length === 0) {
    return [];
  }

  const { data: projects, error: projectsError } = await admin
    .from("projects")
    .select("id, owner_user_id, title, campus, recruitment_status, required_roles")
    .in("id", projectIds);

  if (projectsError) {
    throw new Error(projectsError.message);
  }

  const projectMap = new Map(
    (projects ?? []).map((project) => [project.id, project as ProjectSummaryRow])
  );

  return (applications ?? []).map((application) =>
    mapApplicationRow(application as ApplicationRow, projectMap)
  );
}
