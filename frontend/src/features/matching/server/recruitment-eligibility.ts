import { AppError } from "../../../lib/api/error.ts";

export type RecruitmentGateProject = {
  recruitment_status: string;
  recruitment_deadline: string | null;
};

export type MatchingEligibility = {
  email_verified: boolean;
  onboarding_completed: boolean;
  collaboration_status: string;
};

const RECRUITMENT_CLOSED_MESSAGE =
  "현재 모집 중이거나 마감일이 유효한 프로젝트만 지원하거나 제안할 수 있습니다.";

const ACTOR_INELIGIBLE_MESSAGE =
  "이메일 인증과 온보딩을 완료한 사용자만 지원하거나 제안할 수 있습니다.";

const RECEIVER_INELIGIBLE_MESSAGE =
  "이메일 인증과 온보딩을 완료하고 협업 가능 상태인 사용자에게만 제안할 수 있습니다.";

export function isoDateUtc(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function isRecruitmentOpen(project: RecruitmentGateProject, today: string) {
  return (
    project.recruitment_status === "RECRUITING" &&
    (project.recruitment_deadline === null || project.recruitment_deadline >= today)
  );
}

export function assertRecruitmentOpen(project: RecruitmentGateProject, today: string) {
  if (!isRecruitmentOpen(project, today)) {
    throw new AppError("INVALID_STATE_TRANSITION", RECRUITMENT_CLOSED_MESSAGE);
  }
}

export function assertActorEligible(profile: MatchingEligibility) {
  if (!profile.email_verified || !profile.onboarding_completed) {
    throw new AppError("FORBIDDEN", ACTOR_INELIGIBLE_MESSAGE);
  }
}

export function assertProposalReceiverEligible(profile: MatchingEligibility) {
  if (
    !profile.email_verified ||
    !profile.onboarding_completed ||
    profile.collaboration_status !== "OPEN"
  ) {
    throw new AppError("FORBIDDEN", RECEIVER_INELIGIBLE_MESSAGE);
  }
}
