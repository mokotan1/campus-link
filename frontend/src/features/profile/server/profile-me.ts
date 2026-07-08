import "server-only";

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
};

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

function mapProfileRow(
  email: string,
  campus: string | null,
  profile: ProfileRow,
): ProfileRecord {
  return {
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
  const [{ data: userRow, error: userError }, { data: profile, error: profileError }] =
    await Promise.all([
      admin.from("users").select("campus").eq("id", appUser.id).single(),
      admin
        .from("profiles")
        .select(profileSelect)
        .eq("user_id", appUser.id)
        .single(),
    ]);

  if (userError) {
    throw new Error(userError.message);
  }

  if (profileError) {
    throw new Error(profileError.message);
  }

  return mapProfileRow(appUser.email, userRow.campus, profile);
}

export async function updateMyProfile(values: ProfileFormValues) {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return null;
  }

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
    .update({
      student_id: values.studentId || null,
      department: values.department || null,
      grade: values.grade || null,
      bio: values.bio || null,
      tech_stack: values.techStack || null,
      collaboration_status: values.collaborationStatus,
      display_name: values.displayName || null,
      role_tags: values.roleTags,
      availability_status: values.availabilityStatus || null,
      collaboration_type: values.collaborationType || null,
      weekly_hours: values.weeklyHours || null,
      onboarding_completed: values.onboardingCompleted,
    })
    .eq("user_id", appUser.id)
    .select(profileSelect)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { data: userRow, error: userError } = await admin
    .from("users")
    .select("campus")
    .eq("id", appUser.id)
    .single();

  if (userError) {
    throw new Error(userError.message);
  }

  return mapProfileRow(appUser.email, userRow.campus, profile);
}
