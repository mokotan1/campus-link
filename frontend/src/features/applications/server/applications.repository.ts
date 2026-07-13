import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { throwAppErrorFromRpc } from "@/lib/supabase/rpc-error";
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

type ApplicationDetailRow = ApplicationListRow;

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

export type MatchedContactDetails = {
  userId: number;
  email: string;
  name: string | null;
  campus: string | null;
  department: string;
};

export interface ApplicationRepository {
  findProjectSummary(projectId: number): Promise<ProjectSummary | null>;
  findExisting(projectId: number, applicantUserId: number): Promise<{ id: number } | null>;
  findById(applicationId: number): Promise<ApplicationDetailRow | null>;
  create(
    projectId: number,
    applicantUserId: number,
    message: string,
    targetRole: string,
  ): Promise<MyApplicationRecord>;
  listByApplicant(applicantUserId: number): Promise<MyApplicationRecord[]>;
  ownerDecide(
    applicationId: number,
    decision: "ACCEPTED" | "REJECTED",
  ): Promise<ApplicationDetailRow>;
  applicantWithdraw(applicationId: number): Promise<ApplicationDetailRow>;
  getMatchedContactDetails(otherUserId: number): Promise<MatchedContactDetails | null>;
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

  async findById(applicationId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("applications")
      .select(APPLICATION_SELECT)
      .eq("id", applicationId)
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

  async ownerDecide(applicationId, decision) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("owner_decide_application", {
      p_application_id: applicationId,
      p_decision: decision,
    });

    if (error) {
      throwAppErrorFromRpc(error);
    }

    return data as ApplicationDetailRow;
  },

  async applicantWithdraw(applicationId) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("applicant_withdraw_application", {
      p_application_id: applicationId,
    });

    if (error) {
      throwAppErrorFromRpc(error);
    }

    return data as ApplicationDetailRow;
  },

  async getMatchedContactDetails(otherUserId) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_matched_contact_details", {
      p_other_user_id: otherUserId,
    });

    if (error) {
      throwAppErrorFromRpc(error, {
        NOT_FOUND_OR_FORBIDDEN:
          "수락된 지원 또는 제안 후에만 연락처를 확인할 수 있습니다.",
      });
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      return null;
    }

    return {
      userId: row.user_id,
      email: row.email,
      name: row.name,
      campus: row.campus,
      department: row.department ?? "",
    };
  },
};
