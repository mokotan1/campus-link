import "server-only";

import type { CurrentAppUser } from "@/features/auth/server/current-app-user.mapper";
import { getCurrentAppUser } from "@/features/auth/server/current-app-user";
import {
  assertActorEligible,
  assertProposalReceiverEligible,
  assertRecruitmentOpen,
  isoDateUtc,
} from "@/features/matching/server/recruitment-eligibility";
import { AppError } from "@/lib/api/error";

import {
  assertDistinctProposalUsers,
  assertNoDuplicateProposal,
  assertPendingProposalStatus,
  assertProposalMessage,
  assertProjectOwnerForProposal,
  assertProposalReceiverExists,
  assertReceiverForProposalDecision,
} from "./proposals.guards";
import { proposalRepository, type ProposalRecord } from "./proposals.repository";

export type ProposalFormValues = {
  projectId: number | null;
  receiverUserId: number | null;
  message: string;
};

export function normalizeProposalPayload(body: unknown): ProposalFormValues {
  const payload = (body ?? {}) as Record<string, unknown>;
  const rawProjectId = Number(payload.projectId);
  const rawReceiverUserId = Number(payload.receiverUserId);

  return {
    projectId: Number.isInteger(rawProjectId) ? rawProjectId : null,
    receiverUserId: Number.isInteger(rawReceiverUserId) ? rawReceiverUserId : null,
    message: String(payload.message ?? "").trim(),
  };
}

export function validateProposalPayload(values: ProposalFormValues) {
  if (!values.projectId || values.projectId <= 0) {
    throw new AppError("VALIDATION_ERROR", "올바른 프로젝트 ID가 필요합니다.");
  }

  if (!values.receiverUserId || values.receiverUserId <= 0) {
    throw new AppError("VALIDATION_ERROR", "올바른 수신자 ID가 필요합니다.");
  }

  assertProposalMessage(values.message);
}

export async function createProposal(
  currentUser: CurrentAppUser,
  values: ProposalFormValues,
): Promise<ProposalRecord> {
  validateProposalPayload(values);
  assertDistinctProposalUsers(currentUser, values.receiverUserId!);

  const senderEligibility = await proposalRepository.findMatchingEligibility(
    currentUser.id,
  );

  if (!senderEligibility) {
    throw new AppError(
      "FORBIDDEN",
      "이메일 인증과 온보딩을 완료한 사용자만 지원하거나 제안할 수 있습니다.",
    );
  }

  assertActorEligible(senderEligibility);

  const project = await proposalRepository.findProjectSummary(values.projectId!);

  if (!project) {
    throw new AppError("NOT_FOUND", "프로젝트를 찾을 수 없습니다.");
  }

  assertProjectOwnerForProposal(currentUser, project);
  assertRecruitmentOpen(project, isoDateUtc());

  const receiverEligibility = await proposalRepository.findMatchingEligibility(
    values.receiverUserId!,
  );

  assertProposalReceiverExists(receiverEligibility);
  assertProposalReceiverEligible(receiverEligibility);

  const existing = await proposalRepository.findExisting(
    values.projectId!,
    currentUser.id,
    values.receiverUserId!,
  );

  assertNoDuplicateProposal(existing);

  return proposalRepository.create(
    values.projectId!,
    currentUser.id,
    values.receiverUserId!,
    values.message,
  );
}

export async function decideProposal(
  currentUser: CurrentAppUser,
  proposalId: number,
  decision: "ACCEPTED" | "REJECTED",
) {
  if (!Number.isInteger(proposalId) || proposalId <= 0) {
    throw new AppError("VALIDATION_ERROR", "올바른 제안 ID가 필요합니다.");
  }

  const proposal = await proposalRepository.findById(proposalId);

  if (!proposal) {
    throw new AppError("NOT_FOUND", "제안을 찾을 수 없습니다.");
  }

  assertReceiverForProposalDecision(currentUser, proposal.receiver_user_id);
  assertPendingProposalStatus(proposal.proposal_status);

  return proposalRepository.receiverDecide(proposalId, decision);
}

export async function listSentProposals(currentUser: CurrentAppUser) {
  return proposalRepository.listSent(currentUser.id);
}

export async function listReceivedProposals(currentUser: CurrentAppUser) {
  return proposalRepository.listReceived(currentUser.id);
}

export async function createProposalForSession(values: ProposalFormValues) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return createProposal(currentUser, values);
}

export async function decideProposalForSession(
  proposalId: number,
  decision: "ACCEPTED" | "REJECTED",
) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return decideProposal(currentUser, proposalId, decision);
}

export async function listSentProposalsForSession() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return listSentProposals(currentUser);
}

export async function listReceivedProposalsForSession() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return listReceivedProposals(currentUser);
}
