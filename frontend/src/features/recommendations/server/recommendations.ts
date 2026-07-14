import { isProjectAcceptingNewParticipants } from "../../projects/server/projects.guards.ts";

export const PROJECT_SCORE_WEIGHTS = {
  role: 40,
  tool: 25,
  campus: 15,
  recruiting: 10,
  deadline: 5,
  profileReadiness: 5,
} as const;

export const PROFILE_SCORE_WEIGHTS = {
  role: 40,
  tool: 25,
  campus: 15,
  availability: 10,
  portfolio: 10,
} as const;

export type RecommendationReasonCode =
  | "ROLE_MATCH"
  | "TOOL_MATCH"
  | "CAMPUS_MATCH"
  | "RECRUITING_NOW"
  | "PORTFOLIO_READY"
  | "AVAILABLE_NOW";

export type RecommendationScoreBreakdown = {
  role: number;
  tool: number;
  campus: number;
  recruiting?: number;
  deadline?: number;
  profileReadiness?: number;
  availability?: number;
  portfolio?: number;
};

export type ViewerRecommendationContext = {
  userId: number;
  campus: string | null;
  displayName: string | null;
  roleTags: string[];
  toolTags: string[];
  appliedProjectIds: number[];
};

export type ProjectRecommendationCandidate = {
  id: number;
  ownerUserId: number;
  title: string;
  summary: string;
  campus: string | null;
  requiredRoles: string[];
  tools: string[];
  recruitmentStatus: string;
  endDate: string | null;
  createdAt: string;
};

export type ProfileRecommendationCandidate = {
  userId: number;
  displayName: string | null;
  campus: string | null;
  roleTags: string[];
  toolTags: string[];
  availabilityStatus: string | null;
  hasPublicPortfolio: boolean;
  profileCreatedAt: string;
  onboardingCompleted?: boolean;
  collaborationStatus?: string;
  alreadyProposed?: boolean;
};

export type ProjectRecommendationContext = {
  id: number;
  ownerUserId: number;
  campus: string | null;
  requiredRoles: string[];
  tools: string[];
};

export type RankedProjectRecommendation = ProjectRecommendationCandidate & {
  score: number;
  breakdown: RecommendationScoreBreakdown;
  reasons: RecommendationReasonCode[];
};

export type RankedProfileRecommendation = ProfileRecommendationCandidate & {
  score: number;
  breakdown: RecommendationScoreBreakdown;
  reasons: RecommendationReasonCode[];
};

type RankOptions = {
  referenceDate?: Date;
};

function normalizeTags(values: string[]) {
  return values.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function countOverlap(left: string[], right: string[]) {
  const rightSet = new Set(normalizeTags(right));

  return normalizeTags(left).filter((value) => rightSet.has(value)).length;
}

export function scoreRoleMatch(profileRoles: string[], requiredRoles: string[]) {
  if (requiredRoles.length === 0) {
    return 0;
  }

  const matchedCount = countOverlap(profileRoles, requiredRoles);

  return Math.min(
    PROJECT_SCORE_WEIGHTS.role,
    (matchedCount / requiredRoles.length) * PROJECT_SCORE_WEIGHTS.role,
  );
}

export function scoreToolMatch(profileTools: string[], projectTools: string[]) {
  const matchedCount = countOverlap(profileTools, projectTools);

  return Math.min(PROJECT_SCORE_WEIGHTS.tool, matchedCount * 5);
}

export function scoreCampusMatch(
  viewerCampus: string | null,
  projectCampus: string | null,
  maxScore = PROJECT_SCORE_WEIGHTS.campus,
) {
  const normalizedViewerCampus = viewerCampus?.trim() ?? "";
  const normalizedProjectCampus = projectCampus?.trim() ?? "";

  if (normalizedViewerCampus && normalizedProjectCampus === normalizedViewerCampus) {
    return maxScore;
  }

  if (!normalizedProjectCampus) {
    return Math.round(maxScore / 2);
  }

  return 0;
}

export function scoreRecruitingStatus(recruitmentStatus: string) {
  return recruitmentStatus === "RECRUITING" ? PROJECT_SCORE_WEIGHTS.recruiting : 0;
}

export function scoreDeadlineBuffer(endDate: string | null, referenceDate = new Date()) {
  if (!endDate?.trim()) {
    return 0;
  }

  const deadline = new Date(endDate);

  if (Number.isNaN(deadline.getTime()) || deadline < referenceDate) {
    return 0;
  }

  return PROJECT_SCORE_WEIGHTS.deadline;
}

export function scoreProfileReadiness(
  displayName: string | null,
  campus: string | null,
  roleTags: string[],
) {
  const hasDisplayName = Boolean(displayName?.trim());
  const hasCampus = Boolean(campus?.trim());
  const hasRoleTags = roleTags.length > 0;

  return hasDisplayName && hasCampus && hasRoleTags
    ? PROJECT_SCORE_WEIGHTS.profileReadiness
    : 0;
}

export function scoreAvailability(availabilityStatus: string | null) {
  const normalized = availabilityStatus?.trim() ?? "";

  if (normalized === "바로 가능") {
    return PROFILE_SCORE_WEIGHTS.availability;
  }

  if (normalized === "일정 맞으면 가능") {
    return Math.round(PROFILE_SCORE_WEIGHTS.availability / 2);
  }

  return 0;
}

export function scorePublicPortfolio(hasPublicPortfolio: boolean) {
  return hasPublicPortfolio ? PROFILE_SCORE_WEIGHTS.portfolio : 0;
}

function buildProjectReasons(breakdown: RecommendationScoreBreakdown): RecommendationReasonCode[] {
  const reasons: RecommendationReasonCode[] = [];

  if (breakdown.role > 0) {
    reasons.push("ROLE_MATCH");
  }

  if (breakdown.tool > 0) {
    reasons.push("TOOL_MATCH");
  }

  if (breakdown.campus > 0) {
    reasons.push("CAMPUS_MATCH");
  }

  if ((breakdown.recruiting ?? 0) > 0) {
    reasons.push("RECRUITING_NOW");
  }

  return reasons;
}

function buildProfileReasons(breakdown: RecommendationScoreBreakdown): RecommendationReasonCode[] {
  const reasons: RecommendationReasonCode[] = [];

  if (breakdown.role > 0) {
    reasons.push("ROLE_MATCH");
  }

  if (breakdown.tool > 0) {
    reasons.push("TOOL_MATCH");
  }

  if (breakdown.campus > 0) {
    reasons.push("CAMPUS_MATCH");
  }

  if ((breakdown.portfolio ?? 0) > 0) {
    reasons.push("PORTFOLIO_READY");
  }

  if ((breakdown.availability ?? 0) > 0) {
    reasons.push("AVAILABLE_NOW");
  }

  return reasons;
}

function compareRankedProjects(
  left: RankedProjectRecommendation,
  right: RankedProjectRecommendation,
) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (right.breakdown.role !== left.breakdown.role) {
    return right.breakdown.role - left.breakdown.role;
  }

  const leftCreatedAt = new Date(left.createdAt).getTime();
  const rightCreatedAt = new Date(right.createdAt).getTime();

  if (rightCreatedAt !== leftCreatedAt) {
    return rightCreatedAt - leftCreatedAt;
  }

  return left.id - right.id;
}

function compareRankedProfiles(
  left: RankedProfileRecommendation,
  right: RankedProfileRecommendation,
) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (right.breakdown.role !== left.breakdown.role) {
    return right.breakdown.role - left.breakdown.role;
  }

  const leftCreatedAt = new Date(left.profileCreatedAt).getTime();
  const rightCreatedAt = new Date(right.profileCreatedAt).getTime();

  if (rightCreatedAt !== leftCreatedAt) {
    return rightCreatedAt - leftCreatedAt;
  }

  return left.userId - right.userId;
}

export function rankProjects(
  viewer: ViewerRecommendationContext,
  projects: ProjectRecommendationCandidate[],
  options: RankOptions = {},
) {
  const referenceDate = options.referenceDate ?? new Date();
  const appliedProjectIds = new Set(viewer.appliedProjectIds);

  return projects
    .filter(
      (project) =>
        project.ownerUserId !== viewer.userId &&
        !appliedProjectIds.has(project.id) &&
        isProjectAcceptingNewParticipants(
          {
            recruitment_status: project.recruitmentStatus,
            end_date: project.endDate,
          },
          referenceDate,
        ),
    )
    .map((project) => {
      const breakdown: RecommendationScoreBreakdown = {
        role: scoreRoleMatch(viewer.roleTags, project.requiredRoles),
        tool: scoreToolMatch(viewer.toolTags, project.tools),
        campus: scoreCampusMatch(viewer.campus, project.campus),
        recruiting: scoreRecruitingStatus(project.recruitmentStatus),
        deadline: scoreDeadlineBuffer(project.endDate, referenceDate),
        profileReadiness: scoreProfileReadiness(
          viewer.displayName,
          viewer.campus,
          viewer.roleTags,
        ),
      };

      const score = Object.values(breakdown).reduce((total, value) => total + (value ?? 0), 0);

      return {
        ...project,
        score,
        breakdown,
        reasons: buildProjectReasons(breakdown),
      } satisfies RankedProjectRecommendation;
    })
    .sort(compareRankedProjects);
}

export function rankProfiles(
  project: ProjectRecommendationContext,
  profiles: ProfileRecommendationCandidate[],
  options: RankOptions = {},
) {
  void options;

  return profiles
    .filter(
      (profile) =>
        profile.userId !== project.ownerUserId &&
        profile.onboardingCompleted !== false &&
        profile.collaborationStatus !== "CLOSED" &&
        !profile.alreadyProposed,
    )
    .map((profile) => {
      const breakdown: RecommendationScoreBreakdown = {
        role: scoreRoleMatch(profile.roleTags, project.requiredRoles),
        tool: scoreToolMatch(profile.toolTags, project.tools),
        campus: scoreCampusMatch(project.campus, profile.campus, PROFILE_SCORE_WEIGHTS.campus),
        availability: scoreAvailability(profile.availabilityStatus),
        portfolio: scorePublicPortfolio(profile.hasPublicPortfolio),
      };

      const score = Object.values(breakdown).reduce((total, value) => total + (value ?? 0), 0);

      return {
        ...profile,
        score,
        breakdown,
        reasons: buildProfileReasons(breakdown),
      } satisfies RankedProfileRecommendation;
    })
    .sort(compareRankedProfiles);
}

export async function listProjectRecommendationsForSession() {
  const { getCurrentAppUser } = await import("@/features/auth/server/current-app-user");
  const { recommendationRepository } = await import("./recommendations.repository");

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const context = await recommendationRepository.findViewerContext(currentUser.id);

  return rankProjects(context.viewer, context.projects);
}

export async function listProfileRecommendationsForSession(projectId: number) {
  const { AppError } = await import("@/lib/api/error");
  const { getCurrentAppUser } = await import("@/features/auth/server/current-app-user");
  const { recommendationRepository } = await import("./recommendations.repository");

  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new AppError("VALIDATION_ERROR", "올바른 프로젝트 ID가 필요합니다.");
  }

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const context = await recommendationRepository.findProjectRecommendationContext(
    currentUser.id,
    projectId,
  );

  if (!context) {
    throw new AppError("NOT_FOUND", "프로젝트를 찾을 수 없습니다.");
  }

  if (context.project.ownerUserId !== currentUser.id) {
    throw new AppError("FORBIDDEN", "프로젝트 소유자만 인재 추천을 조회할 수 있습니다.");
  }

  return rankProfiles(context.project, context.profiles);
}
