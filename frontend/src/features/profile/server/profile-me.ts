import "server-only";

import { isSchoolEmail } from "@/features/auth/lib/school-email";
import { getCurrentAppUser } from "@/features/auth/server/current-app-user";

import { profileRepository } from "./profile.repository";

export type ProfileFormValues = {
  displayName: string;
  campus: string;
  studentId: string;
  department: string;
  grade: string;
  bio: string;
  roleTags: string[];
  techStack: string;
  availabilityStatus: string;
  collaborationType: string;
  weeklyHours: string;
  collaborationStatus: "OPEN" | "CLOSED";
  onboardingCompleted: boolean;
};

export type ProfileReadiness = {
  hasSchoolEmail: boolean;
  hasBasicInfo: boolean;
  hasRoleTags: boolean;
  hasPortfolio: boolean;
  hasRoleInWork: boolean;
  hasAvailability: boolean;
  isReady: boolean;
};

export type ProfileRecord = {
  email: string;
  displayName: string;
  campus: string;
  studentId: string;
  department: string;
  grade: string;
  bio: string;
  roleTags: string[];
  techStack: string;
  availabilityStatus: string;
  collaborationType: string;
  weeklyHours: string;
  collaborationStatus: "OPEN" | "CLOSED";
  onboardingCompleted: boolean;
  onboardingStep: number;
  readiness: ProfileReadiness;
};

function resolveOnboardingStep(
  profile: {
    campus: string;
    department: string;
    grade: string;
    roleTags: string[];
    availabilityStatus: string;
    collaborationType: string;
    weeklyHours: string;
    onboardingCompleted: boolean;
  },
  readiness: Pick<ProfileReadiness, "hasPortfolio" | "hasRoleInWork">,
) {
  if (!profile.campus || !profile.department || !profile.grade) return 0;
  if (!profile.roleTags.length) return 1;
  if (!readiness.hasPortfolio || !readiness.hasRoleInWork) return 2;
  if (
    !profile.availabilityStatus ||
    !profile.collaborationType ||
    !profile.weeklyHours
  ) {
    return 3;
  }
  return profile.onboardingCompleted ? 4 : 3;
}

function computeProfileReadiness(
  email: string,
  campus: string | null,
  profile: {
    department: string | null;
    grade: string | null;
    role_tags: string[] | null;
    availability_status: string | null;
  },
  portfolios: Array<{ role_in_work: string | null }>,
): ProfileReadiness {
  const hasPortfolio = portfolios.length > 0;
  const hasRoleInWork = portfolios.some((item) => Boolean(item.role_in_work?.trim()));

  const readiness: ProfileReadiness = {
    hasSchoolEmail: isSchoolEmail(email),
    hasBasicInfo: Boolean(campus && profile.department && profile.grade),
    hasRoleTags: (profile.role_tags ?? []).length > 0,
    hasPortfolio,
    hasRoleInWork,
    hasAvailability: Boolean(profile.availability_status),
    isReady: false,
  };

  readiness.isReady =
    readiness.hasSchoolEmail &&
    readiness.hasBasicInfo &&
    readiness.hasRoleTags &&
    readiness.hasPortfolio &&
    readiness.hasRoleInWork &&
    readiness.hasAvailability;

  return readiness;
}

function mapProfileRecord(
  email: string,
  campus: string | null,
  profile: {
    student_id: string | null;
    department: string | null;
    grade: string | null;
    bio: string | null;
    tech_stack: string | null;
    collaboration_status: string;
    display_name: string | null;
    role_tags: string[] | null;
    availability_status: string | null;
    collaboration_type: string | null;
    weekly_hours: string | null;
    onboarding_completed: boolean;
  },
  readiness: ProfileReadiness,
): ProfileRecord {
  const mapped = {
    email,
    displayName: profile.display_name ?? "",
    campus: campus ?? "",
    studentId: profile.student_id ?? "",
    department: profile.department ?? "",
    grade: profile.grade ?? "",
    bio: profile.bio ?? "",
    roleTags: profile.role_tags ?? [],
    techStack: profile.tech_stack ?? "",
    availabilityStatus: profile.availability_status ?? "",
    collaborationType: profile.collaboration_type ?? "",
    weeklyHours: profile.weekly_hours ?? "",
    collaborationStatus:
      profile.collaboration_status === "CLOSED" ? "CLOSED" : "OPEN",
    onboardingCompleted: profile.onboarding_completed ?? false,
  } satisfies Omit<ProfileRecord, "onboardingStep" | "readiness">;

  return {
    ...mapped,
    onboardingStep: resolveOnboardingStep(mapped, readiness),
    readiness,
  };
}

async function buildProfileRecord(email: string, userId: number) {
  const context = await profileRepository.findContextByUserId(userId);
  const readiness = computeProfileReadiness(
    email,
    context.campus,
    context.profile,
    context.portfolioReadiness,
  );

  return mapProfileRecord(email, context.campus, context.profile, readiness);
}

export async function getMyProfile() {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return null;
  }

  return buildProfileRecord(appUser.email, appUser.id);
}

export async function updateMyProfile(values: ProfileFormValues) {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return null;
  }

  await profileRepository.updateByUserId(appUser.id, values);

  return buildProfileRecord(appUser.email, appUser.id);
}
