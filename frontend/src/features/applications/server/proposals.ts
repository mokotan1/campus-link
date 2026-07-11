import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/features/auth/server/current-app-user";

export type ProposalFormValues = {
  projectId: number | null;
  receiverProfileId: number | null;
  message: string;
};

export type ProposalDecisionValues = {
  status: "ACCEPTED" | "REJECTED";
};

export type MyProposalRecord = {
  id: number;
  direction: "sent" | "received";
  projectId: number;
  message: string;
  status: string;
  createdAt: string;
  project: {
    title: string;
    campus: string;
  };
  profile: {
    id: number;
    name: string;
    campus: string;
    role: string;
  };
};

type ProposalRow = {
  id: number;
  project_id: number;
  sender_user_id: number;
  receiver_user_id: number;
  message: string | null;
  proposal_status: string;
  created_at: string;
};

type ProjectRow = {
  id: number;
  owner_user_id: number;
  title: string;
  campus: string | null;
};

type ProfileRow = {
  id: number;
  user_id: number;
  display_name: string | null;
  role_tags: string[] | null;
};

type UserRow = {
  id: number;
  campus: string | null;
  email: string;
  name: string | null;
};

export function normalizeProposalPayload(body: unknown): ProposalFormValues {
  const payload = (body ?? {}) as Record<string, unknown>;
  const rawProjectId = Number(payload.projectId);
  const rawReceiverProfileId = Number(payload.receiverProfileId);

  return {
    projectId: Number.isInteger(rawProjectId) ? rawProjectId : null,
    receiverProfileId: Number.isInteger(rawReceiverProfileId) ? rawReceiverProfileId : null,
    message: String(payload.message ?? "").trim(),
  };
}

export function validateProposalPayload(values: ProposalFormValues) {
  if (!values.projectId || values.projectId <= 0) {
    throw new Error("올바른 프로젝트 ID가 필요합니다.");
  }

  if (!values.receiverProfileId || values.receiverProfileId <= 0) {
    throw new Error("올바른 제안 대상이 필요합니다.");
  }
}

export function normalizeProposalDecisionPayload(
  body: unknown,
): ProposalDecisionValues {
  const payload = (body ?? {}) as Record<string, unknown>;
  const status = payload.status === "REJECTED" ? "REJECTED" : "ACCEPTED";

  return { status };
}

function mapProposalStatus(status: string) {
  if (status === "PENDING") return "대기";
  if (status === "ACCEPTED") return "수락";
  if (status === "REJECTED") return "거절";
  if (status === "CANCELED") return "취소";
  return status || "대기";
}

function buildProfileLabel(profile: ProfileRow | undefined, user: UserRow | undefined) {
  return (
    String(profile?.display_name ?? "").trim() ||
    String(user?.name ?? "").trim() ||
    String(user?.email ?? "").split("@")[0] ||
    "이름 미입력"
  );
}

function mapProposalRow(
  row: ProposalRow,
  currentUserId: number,
  projectMap: Map<number, ProjectRow>,
  profileByUserId: Map<number, ProfileRow>,
  userMap: Map<number, UserRow>,
) {
  const direction = row.sender_user_id === currentUserId ? "sent" : "received";
  const counterpartyUserId = direction === "sent" ? row.receiver_user_id : row.sender_user_id;
  const project = projectMap.get(row.project_id);
  const profile = profileByUserId.get(counterpartyUserId);
  const user = userMap.get(counterpartyUserId);

  return {
    id: row.id,
    direction,
    projectId: row.project_id,
    message: row.message ?? "",
    status: mapProposalStatus(row.proposal_status),
    createdAt: row.created_at,
    project: {
      title: project?.title ?? "",
      campus: project?.campus ?? "",
    },
    profile: {
      id: profile?.id ?? 0,
      name: buildProfileLabel(profile, user),
      campus: user?.campus ?? "",
      role: profile?.role_tags?.[0] ?? "",
    },
  } satisfies MyProposalRecord;
}

async function getProject(projectId: number) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("id, owner_user_id, title, campus")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProjectRow | null) ?? null;
}

async function getReceiverProfile(profileId: number) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, user_id, display_name, role_tags")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProfileRow | null) ?? null;
}

export async function createProposal(values: ProposalFormValues) {
  validateProposalPayload(values);

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const [project, receiverProfile] = await Promise.all([
    getProject(values.projectId!),
    getReceiverProfile(values.receiverProfileId!),
  ]);

  if (!project) {
    throw new Error("프로젝트를 찾을 수 없습니다.");
  }

  if (!receiverProfile) {
    throw new Error("제안 대상을 찾을 수 없습니다.");
  }

  if (project.owner_user_id !== currentUser.id) {
    throw new Error("내가 등록한 프로젝트로만 제안할 수 있습니다.");
  }

  if (receiverProfile.user_id === currentUser.id) {
    throw new Error("자기 자신에게는 제안할 수 없습니다.");
  }

  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("proposals")
    .select("id")
    .eq("project_id", values.projectId!)
    .eq("sender_user_id", currentUser.id)
    .eq("receiver_user_id", receiverProfile.user_id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    throw new Error("이미 같은 프로젝트로 이 사용자에게 제안했습니다.");
  }

  const { data, error } = await admin
    .from("proposals")
    .insert({
      project_id: values.projectId!,
      sender_user_id: currentUser.id,
      receiver_user_id: receiverProfile.user_id,
      message: values.message || null,
      proposal_status: "PENDING",
    })
    .select("id, project_id, sender_user_id, receiver_user_id, message, proposal_status, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const userMap = new Map<number, UserRow>();
  userMap.set(receiverProfile.user_id, {
    id: receiverProfile.user_id,
    campus: "",
    email: "",
    name: receiverProfile.display_name,
  });

  return mapProposalRow(
    data as ProposalRow,
    currentUser.id,
    new Map([[project.id, project]]),
    new Map([[receiverProfile.user_id, receiverProfile]]),
    userMap,
  );
}

export async function listMyProposals() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const admin = createAdminClient();
  const { data: proposals, error } = await admin
    .from("proposals")
    .select("id, project_id, sender_user_id, receiver_user_id, message, proposal_status, created_at")
    .or(`sender_user_id.eq.${currentUser.id},receiver_user_id.eq.${currentUser.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const proposalRows = (proposals ?? []) as ProposalRow[];

  if (proposalRows.length === 0) {
    return [];
  }

  const projectIds = [...new Set(proposalRows.map((row) => row.project_id))];
  const userIds = [
    ...new Set(
      proposalRows.flatMap((row) => [row.sender_user_id, row.receiver_user_id]),
    ),
  ];

  const [{ data: projects, error: projectsError }, { data: profiles, error: profilesError }, { data: users, error: usersError }] =
    await Promise.all([
      admin.from("projects").select("id, owner_user_id, title, campus").in("id", projectIds),
      admin.from("profiles").select("id, user_id, display_name, role_tags").in("user_id", userIds),
      admin.from("users").select("id, campus, email, name").in("id", userIds),
    ]);

  if (projectsError) {
    throw new Error(projectsError.message);
  }

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  if (usersError) {
    throw new Error(usersError.message);
  }

  const projectMap = new Map((projects ?? []).map((project) => [project.id, project as ProjectRow]));
  const profileByUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile as ProfileRow]));
  const userMap = new Map((users ?? []).map((user) => [user.id, user as UserRow]));

  return proposalRows.map((row) =>
    mapProposalRow(row, currentUser.id, projectMap, profileByUserId, userMap),
  );
}

export async function updateReceivedProposalStatus(
  proposalId: number,
  values: ProposalDecisionValues,
) {
  if (!Number.isInteger(proposalId) || proposalId <= 0) {
    throw new Error("올바른 제안 ID가 필요합니다.");
  }

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const admin = createAdminClient();
  const { data: proposal, error: proposalError } = await admin
    .from("proposals")
    .select("id, project_id, sender_user_id, receiver_user_id, message, proposal_status, created_at")
    .eq("id", proposalId)
    .maybeSingle();

  if (proposalError) {
    throw new Error(proposalError.message);
  }

  if (!proposal) {
    throw new Error("제안 내역을 찾을 수 없습니다.");
  }

  if (proposal.receiver_user_id !== currentUser.id) {
    throw new Error("내가 받은 제안만 처리할 수 있습니다.");
  }

  if (proposal.proposal_status !== "PENDING") {
    throw new Error("이미 처리된 제안입니다.");
  }

  const { data: updated, error: updateError } = await admin
    .from("proposals")
    .update({
      proposal_status: values.status,
    })
    .eq("id", proposalId)
    .select("id, project_id, sender_user_id, receiver_user_id, message, proposal_status, created_at")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  const projectIds = [updated.project_id];
  const userIds = [...new Set([updated.sender_user_id, updated.receiver_user_id])];

  const [{ data: projects, error: projectsError }, { data: profiles, error: profilesError }, { data: users, error: usersError }] =
    await Promise.all([
      admin.from("projects").select("id, owner_user_id, title, campus").in("id", projectIds),
      admin.from("profiles").select("id, user_id, display_name, role_tags").in("user_id", userIds),
      admin.from("users").select("id, campus, email, name").in("id", userIds),
    ]);

  if (projectsError) {
    throw new Error(projectsError.message);
  }

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  if (usersError) {
    throw new Error(usersError.message);
  }

  const projectMap = new Map((projects ?? []).map((project) => [project.id, project as ProjectRow]));
  const profileByUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile as ProfileRow]));
  const userMap = new Map((users ?? []).map((user) => [user.id, user as UserRow]));

  return mapProposalRow(
    updated as ProposalRow,
    currentUser.id,
    projectMap,
    profileByUserId,
    userMap,
  );
}
