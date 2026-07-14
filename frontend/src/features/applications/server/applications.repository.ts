import "server-only";

import type { MatchingEligibility } from "@/features/matching/server/recruitment-eligibility";
import type { Tables } from "@/lib/supabase/database.types";
import { throwAppErrorFromRpc } from "@/lib/supabase/rpc-error";
import { createClient } from "@/lib/supabase/server";

import type { ApplicationDetailRow } from "./applications.guards";
import type { MyApplicationRecord } from "./applications";
import {
  mapReceivedApplicationRows,
  type ReceivedApplicationRecord,
  type ReceivedApplicantProfileRow,
  type ReceivedApplicantRow,
  type ReceivedApplicationRow,
  type ReceivedProjectRow,
} from "./applications.received";

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

/** Local extension until generated types include `recruitment_deadline`. */
type ProjectSummaryRow = Pick<
  Tables<"projects">,
  "id" | "owner_user_id" | "title" | "campus" | "recruitment_status" | "required_roles"
> & {
  recruitment_deadline: string | null;
};

type OwnedProjectRow = Pick<
  Tables<"projects">,
  "id" | "title" | "campus" | "recruitment_status"
>;

type ApplicantUserRow = Pick<Tables<"users">, "id" | "name" | "campus">;

type ApplicantProfileRow = Pick<
  Tables<"profiles">,
  "user_id" | "display_name" | "department"
>;

const APPLICATION_SELECT =
  "id, project_id, applicant_user_id, message, application_status, target_role, created_at" as const;

const PROJECT_SUMMARY_SELECT =
  "id, owner_user_id, title, campus, recruitment_status, recruitment_deadline, required_roles";

function mapApplicationRow(
  row: ApplicationListRow,
  projectMap: Map<number, ProjectSummaryRow>,
  direction: MyApplicationRecord["direction"],
): MyApplicationRecord {
  const project = projectMap.get(row.project_id);

  return {
    id: row.id,
    projectId: row.project_id,
    direction,
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
  findApplicantEligibility(userId: number): Promise<MatchingEligibility | null>;
  findExisting(projectId: number, applicantUserId: number): Promise<{ id: number } | null>;
  findById(applicationId: number): Promise<ApplicationDetailRow | null>;
  create(
    projectId: number,
    applicantUserId: number,
    message: string,
    targetRole: string,
  ): Promise<MyApplicationRecord>;
  listByApplicant(applicantUserId: number): Promise<MyApplicationRecord[]>;
  listByProjectOwner(ownerUserId: number): Promise<MyApplicationRecord[]>;
  listReceivedByProjectOwner(ownerUserId: number): Promise<ReceivedApplicationRecord[]>;
  ownerDecide(
    applicationId: number,
    decision: "ACCEPTED" | "REJECTED",
  ): Promise<unknown>;
  applicantWithdraw(applicationId: number): Promise<unknown>;
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

    return (project as unknown as ProjectSummaryRow | null) ?? null;
  },

  async findApplicantEligibility(userId) {
    const supabase = await createClient();

    const [userResult, profileResult] = await Promise.all([
      supabase.from("users").select("email_verified").eq("id", userId).maybeSingle(),
      supabase
        .from("profiles")
        .select("onboarding_completed, collaboration_status")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (userResult.error) {
      throw new Error(userResult.error.message);
    }

    if (profileResult.error) {
      throw new Error(profileResult.error.message);
    }

    if (!userResult.data || !profileResult.data) {
      return null;
    }

    return {
      email_verified: userResult.data.email_verified,
      onboarding_completed: profileResult.data.onboarding_completed,
      collaboration_status: profileResult.data.collaboration_status,
    };
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

    return mapApplicationRow(application, new Map([[project.id, project]]), "sent");
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

    const projectMap = new Map(
      ((projects ?? []) as unknown as ProjectSummaryRow[]).map((project) => [
        project.id,
        project,
      ]),
    );

    return (applications ?? []).map((application) =>
      mapApplicationRow(application, projectMap, "sent"),
    );
  },

  async listByProjectOwner(ownerUserId) {
    const supabase = await createClient();
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(PROJECT_SUMMARY_SELECT)
      .eq("owner_user_id", ownerUserId);

    if (projectsError) {
      throw new Error(projectsError.message);
    }

    const ownedProjects = (projects ?? []) as unknown as ProjectSummaryRow[];
    const projectIds = ownedProjects.map((project) => project.id);

    if (projectIds.length === 0) {
      return [];
    }

    const { data: applications, error: applicationsError } = await supabase
      .from("applications")
      .select(APPLICATION_SELECT)
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    if (applicationsError) {
      throw new Error(applicationsError.message);
    }

    const projectMap = new Map(ownedProjects.map((project) => [project.id, project]));

    return (applications ?? []).map((application) =>
      mapApplicationRow(application, projectMap, "received"),
    );
  },

  async listReceivedByProjectOwner(ownerUserId) {
    const supabase = await createClient();
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, title, campus, recruitment_status")
      .eq("owner_user_id", ownerUserId);

    if (projectsError) {
      throw new Error(projectsError.message);
    }

    const ownedProjects = (projects ?? []) as OwnedProjectRow[];
    const projectIds = ownedProjects.map((project) => project.id);

    if (projectIds.length === 0) {
      return [];
    }

    const { data: applications, error: applicationsError } = await supabase
      .from("applications")
      .select(APPLICATION_SELECT)
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    if (applicationsError) {
      throw new Error(applicationsError.message);
    }

    const applicationRows = (applications ?? []) as ReceivedApplicationRow[];
    const applicantIds = [
      ...new Set(applicationRows.map((application) => application.applicant_user_id)),
    ];

    if (applicantIds.length === 0) {
      return [];
    }

    const [{ data: applicants, error: applicantsError }, { data: profiles, error: profilesError }] =
      await Promise.all([
        supabase.from("users").select("id, name, campus").in("id", applicantIds),
        supabase
          .from("profiles")
          .select("user_id, display_name, department")
          .in("user_id", applicantIds),
      ]);

    if (applicantsError) {
      throw new Error(applicantsError.message);
    }

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    return mapReceivedApplicationRows(
      applicationRows,
      new Map(ownedProjects.map((project) => [project.id, project as ReceivedProjectRow])),
      new Map(
        ((applicants ?? []) as ApplicantUserRow[]).map((applicant) => [
          applicant.id,
          applicant as ReceivedApplicantRow,
        ]),
      ),
      new Map(
        ((profiles ?? []) as ApplicantProfileRow[]).map((profile) => [
          profile.user_id,
          profile as ReceivedApplicantProfileRow,
        ]),
      ),
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

    return data;
  },

  async applicantWithdraw(applicationId) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("applicant_withdraw_application", {
      p_application_id: applicationId,
    });

    if (error) {
      throwAppErrorFromRpc(error);
    }

    return data;
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
