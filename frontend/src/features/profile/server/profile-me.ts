import "server-only";

import { isSchoolEmail } from "@/features/auth/lib/school-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/features/auth/server/current-app-user";

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

const allowedCampuses = new Set(["대명캠", "성서캠"]);
const allowedGrades = new Set(["1학년", "2학년", "3학년", "4학년", "졸업 예정"]);
const allowedCollaborationStatuses = new Set(["OPEN", "CLOSED"]);

function uniqueTrimmedStrings(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

export function validateProfileValues(values: ProfileFormValues) {
  if (!values.displayName.trim()) {
    throw new Error("이름 또는 닉네임은 필수입니다.");
  }

  if (!allowedCampuses.has(values.campus.trim())) {
    throw new Error("올바른 캠퍼스를 선택해야 합니다.");
  }

  if (!values.department.trim()) {
    throw new Error("학과는 필수입니다.");
  }

  if (!allowedGrades.has(values.grade.trim())) {
    throw new Error("올바른 학년을 선택해야 합니다.");
  }

  const roleTags = uniqueTrimmedStrings(values.roleTags);

  if (roleTags.length === 0) {
    throw new Error("최소 한 개 이상의 역할을 선택해야 합니다.");
  }

  if (!allowedCollaborationStatuses.has(values.collaborationStatus)) {
    throw new Error("올바른 협업 상태가 필요합니다.");
  }

  if (values.onboardingCompleted) {
    if (!values.availabilityStatus.trim()) {
      throw new Error("협업 가능 상태를 입력해야 합니다.");
    }

    if (!values.collaborationType.trim()) {
      throw new Error("원하는 협업 유형을 입력해야 합니다.");
    }

    if (!values.weeklyHours.trim()) {
      throw new Error("주당 가능 시간을 입력해야 합니다.");
    }
  }
}

function resolveOnboardingStep(profile: {
  campus: string;
  department: string;
  grade: string;
  roleTags: string[];
  availabilityStatus: string;
  collaborationType: string;
  weeklyHours: string;
  onboardingCompleted: boolean;
}, readiness: Pick<ProfileReadiness, "hasPortfolio" | "hasRoleInWork">) {
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

type ProfileRow = {
  student_id: string | null;
  department: string | null;
  grade: string | null;
  bio: string | null;
  tech_stack: string | null;
  collaboration_status: string | null;
  display_name: string | null;
  role_tags: string[] | null;
  availability_status: string | null;
  collaboration_type: string | null;
  weekly_hours: string | null;
  onboarding_completed: boolean | null;
};

type PortfolioReadinessRow = {
  role_in_work: string | null;
};

function computeProfileReadiness(
  email: string,
  campus: string | null,
  profile: ProfileRow,
  portfolios: PortfolioReadinessRow[],
): ProfileReadiness {
  const hasPortfolio = portfolios.length > 0;
  const hasRoleInWork = portfolios.some((item) =>
    Boolean(item.role_in_work?.trim()),
  );

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

function mapProfileRow(
  email: string,
  campus: string | null,
  profile: ProfileRow,
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

const profileSelect =
  "student_id, department, grade, bio, tech_stack, collaboration_status, display_name, role_tags, availability_status, collaboration_type, weekly_hours, onboarding_completed";

export async function getMyProfile() {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return null;
  }

  const admin = createAdminClient();
  const [
    { data: userRow, error: userError },
    { data: profile, error: profileError },
    { data: portfolios, error: portfoliosError },
  ] = await Promise.all([
    admin.from("users").select("campus").eq("id", appUser.id).single(),
    admin
      .from("profiles")
      .select(profileSelect)
      .eq("user_id", appUser.id)
      .single(),
    admin
      .from("portfolio_items")
      .select("role_in_work")
      .eq("user_id", appUser.id),
  ]);

  if (userError) {
    throw new Error(userError.message);
  }

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (portfoliosError) {
    throw new Error(portfoliosError.message);
  }

  const readiness = computeProfileReadiness(
    appUser.email,
    userRow.campus,
    profile,
    portfolios ?? [],
  );

  return mapProfileRow(appUser.email, userRow.campus, profile, readiness);
}

export async function updateMyProfile(values: ProfileFormValues) {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return null;
  }

  validateProfileValues(values);

  const normalizedRoleTags = uniqueTrimmedStrings(values.roleTags);

  const admin = createAdminClient();

  if (values.campus) {
    const { error: campusError } = await admin
      .from("users")
      .update({ campus: values.campus })
      .eq("id", appUser.id);

    if (campusError) {
      throw new Error(campusError.message);
    }
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .upsert(
      {
        user_id: appUser.id,
        student_id: values.studentId || null,
        department: values.department || null,
        grade: values.grade || null,
        bio: values.bio || null,
        tech_stack: values.techStack || null,
        collaboration_status: values.collaborationStatus,
        display_name: values.displayName || null,
        role_tags: normalizedRoleTags,
        availability_status: values.availabilityStatus || null,
        collaboration_type: values.collaborationType || null,
        weekly_hours: values.weeklyHours || null,
        onboarding_completed: values.onboardingCompleted,
      },
      { onConflict: "user_id" },
    )
    .select(profileSelect)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const [{ data: userRow, error: userError }, { data: portfolios, error: portfoliosError }] =
    await Promise.all([
      admin.from("users").select("campus").eq("id", appUser.id).single(),
      admin
        .from("portfolio_items")
        .select("role_in_work")
        .eq("user_id", appUser.id),
    ]);

  if (userError) {
    throw new Error(userError.message);
  }

  if (portfoliosError) {
    throw new Error(portfoliosError.message);
  }

  const readiness = computeProfileReadiness(
    appUser.email,
    userRow.campus,
    profile,
    portfolios ?? [],
  );

  return mapProfileRow(appUser.email, userRow.campus, profile, readiness);
}
