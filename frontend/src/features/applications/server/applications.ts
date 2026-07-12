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

export type ReceivedApplicationRecord = {
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
  applicant: {
    userId: number;
    name: string;
    email: string;
    campus: string;
    department: string;
  };
};

export type ApplicationDecisionValues = {
  status: "ACCEPTED" | "REJECTED";
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

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  campus: string | null;
};

type ProfileRow = {
  user_id: number;
  department: string | null;
  onboarding_completed: boolean | null;
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

function buildApplicantName(user: UserRow | undefined) {
  return (
    String(user?.name ?? "").trim() ||
    String(user?.email ?? "").split("@")[0] ||
    "이름 미입력"
  );
}

function mapReceivedApplicationRow(
  row: ApplicationRow,
  projectMap: Map<number, ProjectSummaryRow>,
  userMap: Map<number, UserRow>,
  profileMap: Map<number, ProfileRow>,
) {
  const project = projectMap.get(row.project_id);
  const user = userMap.get(row.applicant_user_id);
  const profile = profileMap.get(row.applicant_user_id);

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
    applicant: {
      userId: row.applicant_user_id,
      name: buildApplicantName(user),
      email: user?.email ?? "",
      campus: user?.campus ?? "",
      department: profile?.department ?? "",
    },
  } satisfies ReceivedApplicationRecord;
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

export function normalizeApplicationDecisionPayload(
  body: unknown,
): ApplicationDecisionValues {
  const payload = (body ?? {}) as Record<string, unknown>;
  const status = payload.status === "REJECTED" ? "REJECTED" : "ACCEPTED";

  return { status };
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

async function ensureApplicantReady(userId: number, email: string) {
  const admin = createAdminClient();

  if (!email.endsWith("@kmu.ac.kr")) {
    throw new Error("학교 이메일 계정만 프로젝트에 지원할 수 있습니다.");
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .select("user_id, department, onboarding_completed")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile) {
    throw new Error("프로필을 먼저 생성해야 합니다.");
  }

  if (!profile.onboarding_completed) {
    throw new Error("온보딩을 완료한 뒤 프로젝트에 지원할 수 있습니다.");
  }
}

export async function createApplication(values: ApplicationFormValues) {
  validateApplicationPayload(values);

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  await ensureApplicantReady(currentUser.id, currentUser.email);

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

export async function listReceivedApplications() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const admin = createAdminClient();
  const { data: ownedProjects, error: ownedProjectsError } = await admin
    .from("projects")
    .select("id, owner_user_id, title, campus, recruitment_status, required_roles")
    .eq("owner_user_id", currentUser.id);

  if (ownedProjectsError) {
    throw new Error(ownedProjectsError.message);
  }

  const projectRows = (ownedProjects ?? []) as ProjectSummaryRow[];
  const projectIds = [...new Set(projectRows.map((project) => project.id))];

  if (projectIds.length === 0) {
    return [];
  }

  const { data: applications, error } = await admin
    .from("applications")
    .select("id, project_id, applicant_user_id, message, application_status, target_role, created_at")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const applicationRows = (applications ?? []) as ApplicationRow[];
  const applicantIds = [...new Set(applicationRows.map((item) => item.applicant_user_id))];

  if (applicantIds.length === 0) {
    return [];
  }

  const [{ data: users, error: usersError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      admin.from("users").select("id, email, name, campus").in("id", applicantIds),
      admin
        .from("profiles")
        .select("user_id, department, onboarding_completed")
        .in("user_id", applicantIds),
    ]);

  if (usersError) {
    throw new Error(usersError.message);
  }

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const projectMap = new Map(projectRows.map((project) => [project.id, project]));
  const userMap = new Map((users ?? []).map((user) => [user.id, user as UserRow]));
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile as ProfileRow]),
  );

  return applicationRows.map((application) =>
    mapReceivedApplicationRow(application, projectMap, userMap, profileMap),
  );
}

export async function updateReceivedApplicationStatus(
  applicationId: number,
  values: ApplicationDecisionValues,
) {
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    throw new Error("올바른 지원 ID가 필요합니다.");
  }

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const admin = createAdminClient();
  const { data: application, error: applicationError } = await admin
    .from("applications")
    .select("id, project_id, applicant_user_id, message, application_status, target_role, created_at")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError) {
    throw new Error(applicationError.message);
  }

  if (!application) {
    throw new Error("지원 내역을 찾을 수 없습니다.");
  }

  const project = await getProjectSummary(application.project_id);

  if (!project) {
    throw new Error("프로젝트를 찾을 수 없습니다.");
  }

  if (project.owner_user_id !== currentUser.id) {
    throw new Error("내 프로젝트에 들어온 지원만 처리할 수 있습니다.");
  }

  if (application.application_status !== "PENDING") {
    throw new Error("이미 처리된 지원입니다.");
  }

  const { data: updated, error: updateError } = await admin
    .from("applications")
    .update({
      application_status: values.status,
    })
    .eq("id", applicationId)
    .select("id, project_id, applicant_user_id, message, application_status, target_role, created_at")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  const [{ data: users, error: usersError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      admin.from("users").select("id, email, name, campus").eq("id", application.applicant_user_id),
      admin
        .from("profiles")
        .select("user_id, department, onboarding_completed")
        .eq("user_id", application.applicant_user_id),
    ]);

  if (usersError) {
    throw new Error(usersError.message);
  }

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const userMap = new Map((users ?? []).map((user) => [user.id, user as UserRow]));
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile as ProfileRow]),
  );

  return mapReceivedApplicationRow(
    updated as ApplicationRow,
    new Map([[project.id, project]]),
    userMap,
    profileMap,
  );
}
