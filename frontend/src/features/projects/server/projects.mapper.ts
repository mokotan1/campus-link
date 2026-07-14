import type { Tables } from "@/lib/supabase/database.types";

import type { ProjectRecord } from "./projects";

/** Local until generated database.types includes the new columns. */
export type ProjectStatusColumns = {
  project_status: string;
  recruitment_deadline: string | null;
};

export type ProjectListRow = Pick<
  Tables<"projects">,
  | "id"
  | "owner_user_id"
  | "title"
  | "summary"
  | "description"
  | "project_type"
  | "collaboration_mode"
  | "recruitment_status"
  | "campus"
  | "required_roles"
  | "tools"
  | "expected_member_count"
  | "start_date"
  | "end_date"
  | "created_at"
  | "cover_image_name"
> &
  ProjectStatusColumns;

export type OwnerProfileRow = Pick<
  Tables<"profiles">,
  "user_id" | "department" | "display_name"
>;

export type SelfUserRow = {
  id: number;
  email: string;
  name: string | null;
};

/**
 * Session contract for GET /api/projects/mine:
 * unauthenticated callers yield the null sentinel routes map to 401.
 */
export async function listMyProjectsForUser(
  currentUser: { id: number } | null,
  listMine: (ownerUserId: number) => Promise<ProjectRecord[]>,
): Promise<ProjectRecord[] | null> {
  if (!currentUser) {
    return null;
  }

  return listMine(currentUser.id);
}

export function mapProjectRow(
  row: ProjectListRow,
  ownerProfiles: Map<number, OwnerProfileRow>,
  selfUser: SelfUserRow | null,
): ProjectRecord {
  const profile = ownerProfiles.get(row.owner_user_id);
  const isSelf = selfUser?.id === row.owner_user_id;

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    description: row.description ?? "",
    projectType: row.project_type,
    collaborationMode: row.collaboration_mode,
    recruitmentStatus: row.recruitment_status,
    projectStatus: row.project_status,
    campus: row.campus ?? "",
    requiredRoles: row.required_roles ?? [],
    tools: row.tools ?? [],
    expectedMemberCount: row.expected_member_count,
    startDate: row.start_date,
    endDate: row.end_date,
    recruitmentDeadline: row.recruitment_deadline,
    createdAt: row.created_at,
    coverImageName: row.cover_image_name,
    owner: {
      userId: row.owner_user_id,
      email: isSelf ? (selfUser?.email ?? "") : "",
      name: isSelf ? (selfUser?.name ?? null) : (profile?.display_name ?? null),
      department: profile?.department ?? "",
    },
  };
}
