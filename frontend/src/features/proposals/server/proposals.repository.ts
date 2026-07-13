import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { throwAppErrorFromRpc } from "@/lib/supabase/rpc-error";
import { createClient } from "@/lib/supabase/server";

type ProposalRow = Pick<
  Tables<"proposals">,
  | "id"
  | "project_id"
  | "sender_user_id"
  | "receiver_user_id"
  | "message"
  | "proposal_status"
  | "created_at"
  | "updated_at"
>;

type ProjectSummaryRow = Pick<
  Tables<"projects">,
  "id" | "owner_user_id" | "title" | "campus" | "recruitment_status"
>;

const PROPOSAL_SELECT =
  "id, project_id, sender_user_id, receiver_user_id, message, proposal_status, created_at, updated_at" as const;

const PROJECT_SUMMARY_SELECT =
  "id, owner_user_id, title, campus, recruitment_status" as const;

export type ProjectSummary = ProjectSummaryRow;

export type ProposalRecord = {
  id: number;
  projectId: number;
  senderUserId: number;
  receiverUserId: number;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  project: {
    title: string;
    campus: string | null;
    recruitmentStatus: string;
  };
};

function mapProposalRow(
  row: ProposalRow,
  projectMap: Map<number, ProjectSummaryRow>,
): ProposalRecord {
  const project = projectMap.get(row.project_id);

  return {
    id: row.id,
    projectId: row.project_id,
    senderUserId: row.sender_user_id,
    receiverUserId: row.receiver_user_id,
    message: row.message ?? "",
    status: row.proposal_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    project: {
      title: project?.title ?? "",
      campus: project?.campus ?? null,
      recruitmentStatus: project?.recruitment_status ?? "",
    },
  };
}

export interface ProposalRepository {
  findProjectSummary(projectId: number): Promise<ProjectSummary | null>;
  findExisting(
    projectId: number,
    senderUserId: number,
    receiverUserId: number,
  ): Promise<{ id: number } | null>;
  findById(proposalId: number): Promise<ProposalRow | null>;
  create(
    projectId: number,
    senderUserId: number,
    receiverUserId: number,
    message: string,
  ): Promise<ProposalRecord>;
  listSent(senderUserId: number): Promise<ProposalRecord[]>;
  listReceived(receiverUserId: number): Promise<ProposalRecord[]>;
  receiverDecide(
    proposalId: number,
    decision: "ACCEPTED" | "REJECTED",
  ): Promise<ProposalRow>;
  senderCancel(proposalId: number): Promise<ProposalRow>;
}

async function loadProjectMap(projectIds: number[]) {
  if (projectIds.length === 0) {
    return new Map<number, ProjectSummaryRow>();
  }

  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select(PROJECT_SUMMARY_SELECT)
    .in("id", projectIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((projects ?? []).map((project) => [project.id, project]));
}

export const proposalRepository: ProposalRepository = {
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

  async findExisting(projectId, senderUserId, receiverUserId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("proposals")
      .select("id")
      .eq("project_id", projectId)
      .eq("sender_user_id", senderUserId)
      .eq("receiver_user_id", receiverUserId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async findById(proposalId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("proposals")
      .select(PROPOSAL_SELECT)
      .eq("id", proposalId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async create(projectId, senderUserId, receiverUserId, message) {
    const supabase = await createClient();
    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert({
        project_id: projectId,
        sender_user_id: senderUserId,
        receiver_user_id: receiverUserId,
        message: message || null,
        proposal_status: "PENDING",
      })
      .select(PROPOSAL_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const projectMap = await loadProjectMap([projectId]);

    return mapProposalRow(proposal, projectMap);
  },

  async listSent(senderUserId) {
    const supabase = await createClient();
    const { data: proposals, error } = await supabase
      .from("proposals")
      .select(PROPOSAL_SELECT)
      .eq("sender_user_id", senderUserId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const projectIds = [...new Set((proposals ?? []).map((item) => item.project_id))];
    const projectMap = await loadProjectMap(projectIds);

    return (proposals ?? []).map((proposal) => mapProposalRow(proposal, projectMap));
  },

  async listReceived(receiverUserId) {
    const supabase = await createClient();
    const { data: proposals, error } = await supabase
      .from("proposals")
      .select(PROPOSAL_SELECT)
      .eq("receiver_user_id", receiverUserId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const projectIds = [...new Set((proposals ?? []).map((item) => item.project_id))];
    const projectMap = await loadProjectMap(projectIds);

    return (proposals ?? []).map((proposal) => mapProposalRow(proposal, projectMap));
  },

  async receiverDecide(proposalId, decision) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("receiver_decide_proposal", {
      p_proposal_id: proposalId,
      p_decision: decision,
    });

    if (error) {
      throwAppErrorFromRpc(error);
    }

    return data as ProposalRow;
  },

  async senderCancel(proposalId) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("sender_cancel_proposal", {
      p_proposal_id: proposalId,
    });

    if (error) {
      throwAppErrorFromRpc(error);
    }

    return data as ProposalRow;
  },
};
