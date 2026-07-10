import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

import type { ProjectFormValues, ProjectListFilters, ProjectRecord } from "./projects";

type ProjectListRow = Pick<
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
>;

const PROJECT_SELECT =
  "id, owner_user_id, title, summary, description, project_type, collaboration_mode, recruitment_status, campus, required_roles, tools, expected_member_count, start_date, end_date, created_at, cover_image_name" as const;

const OWNER_PROFILE_SELECT = "user_id, department, display_name" as const;

type OwnerProfileRow = Pick<Tables<"profiles">, "user_id" | "department" | "display_name">;

/**
 * Supabase/PostgREST `.or()` parses filter strings literally; strip metacharacters
 * so user search text cannot inject filter syntax.
 */
function escapeLikeQuery(value: string) {
  return value
    .replaceAll(/[,()%_*."'\\]/g, "")
    .trim()
    .slice(0, 100);
}

function mapProjectRow(
  row: ProjectListRow,
  ownerProfiles: Map<number, OwnerProfileRow>,
  selfUser: { id: number; email: string; name: string | null } | null,
) {
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
      email: isSelf ? (selfUser?.email ?? "") : "",
      name: isSelf ? (selfUser?.name ?? null) : (profile?.display_name ?? null),
      department: profile?.department ?? "",
    },
  } satisfies ProjectRecord;
}

async function loadOwnerContext(ownerIds: number[], currentUserId: number | null) {
  const supabase = await createClient();

  const profileQuery = supabase
    .from("profiles")
    .select(OWNER_PROFILE_SELECT)
    .in("user_id", ownerIds);

  const selfUserQuery =
    currentUserId !== null
      ? supabase.from("users").select("id, email, name").eq("id", currentUserId).maybeSingle()
      : Promise.resolve({ data: null, error: null });

  const [{ data: profiles, error: profilesError }, { data: selfUser, error: selfUserError }] =
    await Promise.all([profileQuery, selfUserQuery]);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  if (selfUserError) {
    throw new Error(selfUserError.message);
  }

  const ownerProfiles = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  );

  return {
    ownerProfiles,
    selfUser: selfUser as { id: number; email: string; name: string | null } | null,
  };
}

export interface ProjectRepository {
  list(filters: ProjectListFilters, currentUserId: number | null): Promise<ProjectRecord[]>;
  findById(id: number, currentUserId: number | null): Promise<ProjectRecord | null>;
  create(ownerUserId: number, values: ProjectFormValues): Promise<ProjectRecord>;
}

export const projectRepository: ProjectRepository = {
  async list(filters, currentUserId) {
    const supabase = await createClient();
    let query = supabase
      .from("projects")
      .select(PROJECT_SELECT)
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

    const { ownerProfiles, selfUser } = await loadOwnerContext(ownerIds, currentUserId);

    return (projects ?? []).map((project) =>
      mapProjectRow(project, ownerProfiles, selfUser),
    );
  },

  async findById(id, currentUserId) {
    const supabase = await createClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!project) {
      return null;
    }

    const { ownerProfiles, selfUser } = await loadOwnerContext([project.owner_user_id], currentUserId);

    return mapProjectRow(project, ownerProfiles, selfUser);
  },

  async create(ownerUserId, values) {
    const supabase = await createClient();
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        owner_user_id: ownerUserId,
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
      .select(PROJECT_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const { ownerProfiles, selfUser } = await loadOwnerContext([ownerUserId], ownerUserId);

    return mapProjectRow(project, ownerProfiles, selfUser);
  },
};
