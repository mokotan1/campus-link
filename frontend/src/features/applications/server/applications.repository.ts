import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

import type { MyApplicationRecord } from "./applications";

type ApplicationListRow = Pick<
  Tables<"applications">,
  | "id"
  | "project_id"
  | "applicant_user_id"
  | "message"
  | "application_status"
  | "target_role"
  | "created_at"
>;

type ProjectSummaryRow = Pick<
  Tables<"projects">,
  "id" | "owner_user_id" | "title" | "campus" | "recruitment_status" | "required_roles"
>;

const APPLICATION_SELECT =
  "id, project_id, applicant_user_id, message, application_status, target_role, created_at" as const;

const PROJECT_SUMMARY_SELECT =
  "id, owner_user_id, title, campus, recruitment_status, required_roles" as const;

function mapApplicationRow(
  row: ApplicationListRow,
  projectMap: Map<number, ProjectSummaryRow>,
): MyApplicationRecord {
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
  };
}

export type ProjectSummary = ProjectSummaryRow;

export interface ApplicationRepository {
  findProjectSummary(projectId: number): Promise<ProjectSummary | null>;
  findExisting(projectId: number, applicantUserId: number): Promise<{ id: number } | null>;
  create(
    projectId: number,
    applicantUserId: number,
    message: string,
    targetRole: string,
  ): Promise<MyApplicationRecord>;
  listByApplicant(applicantUserId: number): Promise<MyApplicationRecord[]>;
}

export const applicationRepository: ApplicationRepository = {
  async findProjectSummary(projectId) {
    const supabase = await createClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select(PROJECT_SUMMARY_SELECT)
      .eq("id", projectId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return project ?? null;
  },

  async findExisting(projectId, applicantUserId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("applications")
      .select("id")
      .eq("project_id", projectId)
      .eq("applicant_user_id", applicantUserId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async create(projectId, applicantUserId, message, targetRole) {
    const supabase = await createClient();
    const { data: application, error } = await supabase
      .from("applications")
      .insert({
        project_id: projectId,
        applicant_user_id: applicantUserId,
        message: message || null,
        application_status: "PENDING",
        target_role: targetRole,
      })
      .select(APPLICATION_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const project = await applicationRepository.findProjectSummary(projectId);

    if (!project) {
      throw new Error("프로젝트를 찾을 수 없습니다.");
    }

    return mapApplicationRow(application, new Map([[project.id, project]]));
  },

  async listByApplicant(applicantUserId) {
    const supabase = await createClient();
    const { data: applications, error } = await supabase
      .from("applications")
      .select(APPLICATION_SELECT)
      .eq("applicant_user_id", applicantUserId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const projectIds = [...new Set((applications ?? []).map((item) => item.project_id))];

    if (projectIds.length === 0) {
      return [];
    }

    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(PROJECT_SUMMARY_SELECT)
      .in("id", projectIds);

    if (projectsError) {
      throw new Error(projectsError.message);
    }

    const projectMap = new Map((projects ?? []).map((project) => [project.id, project]));

    return (applications ?? []).map((application) =>
      mapApplicationRow(application, projectMap),
    );
  },
};
