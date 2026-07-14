import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { ProjectFormValues, ProjectListFilters, ProjectRecord } from "./projects";
import {
  mapProjectRow,
  type OwnerProfileRow,
  type ProjectListRow,
  type SelfUserRow,
} from "./projects.mapper";

const PROJECT_SELECT =
  "id, owner_user_id, title, summary, description, project_type, collaboration_mode, recruitment_status, project_status, campus, required_roles, tools, expected_member_count, start_date, end_date, recruitment_deadline, created_at, cover_image_name" as const;

const OWNER_PROFILE_SELECT = "user_id, department, display_name" as const;

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

  const ownerProfiles = new Map<number, OwnerProfileRow>(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  );

  return {
    ownerProfiles,
    selfUser: selfUser as SelfUserRow | null,
  };
}

function asProjectListRows(data: unknown): ProjectListRow[] {
  return (data ?? []) as ProjectListRow[];
}

function asProjectListRow(data: unknown): ProjectListRow {
  return data as ProjectListRow;
}

export interface ProjectRepository {
  list(filters: ProjectListFilters, currentUserId: number | null): Promise<ProjectRecord[]>;
  listMine(ownerUserId: number): Promise<ProjectRecord[]>;
  findById(id: number, currentUserId: number | null): Promise<ProjectRecord | null>;
  create(ownerUserId: number, values: ProjectFormValues): Promise<ProjectRecord>;
  findOwnerUserId(id: number): Promise<number | null>;
  update(id: number, ownerUserId: number, values: ProjectFormValues): Promise<ProjectRecord>;
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

    const rows = asProjectListRows(projects);
    const ownerIds = [...new Set(rows.map((project) => project.owner_user_id))];

    if (ownerIds.length === 0) {
      return [];
    }

    const { ownerProfiles, selfUser } = await loadOwnerContext(ownerIds, currentUserId);

    return rows.map((project) => mapProjectRow(project, ownerProfiles, selfUser));
  },

  async listMine(ownerUserId) {
    const supabase = await createClient();
    const { data: projects, error } = await supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("owner_user_id", ownerUserId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = asProjectListRows(projects);

    if (rows.length === 0) {
      return [];
    }

    const { ownerProfiles, selfUser } = await loadOwnerContext([ownerUserId], ownerUserId);

    return rows.map((project) => mapProjectRow(project, ownerProfiles, selfUser));
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

    const row = asProjectListRow(project);
    const { ownerProfiles, selfUser } = await loadOwnerContext([row.owner_user_id], currentUserId);

    return mapProjectRow(row, ownerProfiles, selfUser);
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

    const row = asProjectListRow(project);
    const { ownerProfiles, selfUser } = await loadOwnerContext([ownerUserId], ownerUserId);

    return mapProjectRow(row, ownerProfiles, selfUser);
  },

  async findOwnerUserId(id) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("owner_user_id")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.owner_user_id ?? null;
  },

  async update(id, ownerUserId, values) {
    const supabase = await createClient();
    const { data: project, error } = await supabase
      .from("projects")
      .update({
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
      .eq("id", id)
      .eq("owner_user_id", ownerUserId)
      .select(PROJECT_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const row = asProjectListRow(project);
    const { ownerProfiles, selfUser } = await loadOwnerContext([ownerUserId], ownerUserId);

    return mapProjectRow(row, ownerProfiles, selfUser);
  },
};
