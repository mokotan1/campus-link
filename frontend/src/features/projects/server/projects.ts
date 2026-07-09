import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/features/auth/server/current-app-user";

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

/**
 * Supabase/PostgREST의 `.or()` 필터는 문자열을 그대로 파싱하기 때문에
 * `,` `(` `)` `.` `*` `%` `_` 같은 문자를 이스케이프하지 않고 넣으면
 * 사용자가 검색어로 필터 문법 자체를 조작할 수 있다 (예: `x,id.neq.0` 로
 * 조건을 추가하거나 `)` `(` 로 논리 그룹을 깨는 인젝션).
 * 검색에는 필요 없는 필터 예약 문자들을 모두 제거해서 순수 텍스트만 남긴다.
 */
function escapeLikeQuery(value: string) {
  return value
    .replaceAll(/[,()%_*."'\\]/g, "")
    .trim()
    .slice(0, 100);
}

type ProjectRow = {
  id: number;
  owner_user_id: number;
  title: string;
  summary: string;
  description: string | null;
  project_type: string;
  collaboration_mode: string;
  recruitment_status: string;
  campus: string | null;
  required_roles: string[] | null;
  tools: string[] | null;
  expected_member_count: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  cover_image_name: string | null;
};

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
    throw new Error("프로젝트 제목은 필수입니다.");
  }

  if (!values.summary) {
    throw new Error("프로젝트 한 줄 소개는 필수입니다.");
  }

  if (!values.projectType) {
    throw new Error("프로젝트 유형은 필수입니다.");
  }

  if (!values.collaborationMode) {
    throw new Error("협업 방식은 필수입니다.");
  }
}

function mapProjectRow(
  row: ProjectRow,
  owners: Map<number, { email: string; name: string | null }>,
  departments: Map<number, string>
) {
  const owner = owners.get(row.owner_user_id);

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    description: row.description ?? "",
    projectType: row.project_type,
    collaborationMode: row.collaboration_mode,
    recruitmentStatus: row.recruitment_status,
    campus: row.campus ?? "",
    requiredRoles: row.required_roles ?? [],
    tools: row.tools ?? [],
    expectedMemberCount: row.expected_member_count,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    coverImageName: row.cover_image_name,
    owner: {
      userId: row.owner_user_id,
      email: owner?.email ?? "",
      name: owner?.name ?? null,
      department: departments.get(row.owner_user_id) ?? "",
    },
  } satisfies ProjectRecord;
}

async function loadOwnerMaps(ownerIds: number[]) {
  const admin = createAdminClient();
  const [{ data: owners, error: ownersError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      admin.from("users").select("id, email, name").in("id", ownerIds),
      admin.from("profiles").select("user_id, department").in("user_id", ownerIds),
    ]);

  if (ownersError) {
    throw new Error(ownersError.message);
  }

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const ownerMap = new Map(
    (owners ?? []).map((owner) => [owner.id, { email: owner.email, name: owner.name }])
  );
  const departmentMap = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile.department ?? ""])
  );

  return { ownerMap, departmentMap };
}

export async function listProjects(filters: ProjectListFilters) {
  const admin = createAdminClient();
  let query = admin
    .from("projects")
    .select(
      "id, owner_user_id, title, summary, description, project_type, collaboration_mode, recruitment_status, campus, required_roles, tools, expected_member_count, start_date, end_date, created_at, cover_image_name"
    )
    .order("created_at", { ascending: false });

  if (filters.query) {
    const search = escapeLikeQuery(filters.query);

    if (search) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    }
  }

  if (filters.campus) {
    query = query.eq("campus", filters.campus);
  }

  if (filters.status) {
    query = query.eq("recruitment_status", filters.status);
  }

  if (filters.role) {
    query = query.contains("required_roles", [filters.role]);
  }

  const { data: projects, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const ownerIds = [...new Set((projects ?? []).map((project) => project.owner_user_id))];

  if (ownerIds.length === 0) {
    return [];
  }

  const { ownerMap, departmentMap } = await loadOwnerMaps(ownerIds);

  return (projects ?? []).map((project) =>
    mapProjectRow(project as ProjectRow, ownerMap, departmentMap)
  );
}

export async function getProjectById(projectId: number) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new Error("올바른 프로젝트 ID가 필요합니다.");
  }

  const admin = createAdminClient();
  const { data: project, error } = await admin
    .from("projects")
    .select(
      "id, owner_user_id, title, summary, description, project_type, collaboration_mode, recruitment_status, campus, required_roles, tools, expected_member_count, start_date, end_date, created_at, cover_image_name"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!project) {
    return null;
  }

  const { ownerMap, departmentMap } = await loadOwnerMaps([project.owner_user_id]);

  return mapProjectRow(project as ProjectRow, ownerMap, departmentMap);
}

export async function createProject(values: ProjectFormValues) {
  validateProjectPayload(values);

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const admin = createAdminClient();
  const { data: project, error } = await admin
    .from("projects")
    .insert({
      owner_user_id: currentUser.id,
      title: values.title,
      summary: values.summary,
      description: values.description || null,
      project_type: values.projectType,
      collaboration_mode: values.collaborationMode,
      recruitment_status: values.recruitmentStatus,
      campus: values.campus || null,
      required_roles: values.requiredRoles,
      tools: values.tools,
      expected_member_count: values.expectedMemberCount,
      start_date: values.startDate || null,
      end_date: values.endDate || null,
      cover_image_name: values.coverImageName || null,
    })
    .select(
      "id, owner_user_id, title, summary, description, project_type, collaboration_mode, recruitment_status, campus, required_roles, tools, expected_member_count, start_date, end_date, created_at, cover_image_name"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("department")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return mapProjectRow(
    project as ProjectRow,
    new Map([
      [
        currentUser.id,
        {
          email: currentUser.email,
          name: currentUser.name,
        },
      ],
    ]),
    new Map([[currentUser.id, profile?.department ?? ""]])
  );
}
