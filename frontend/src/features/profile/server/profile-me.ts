import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export type ProfileFormValues = {
  studentId: string;
  department: string;
  grade: string;
  bio: string;
  techStack: string;
  collaborationStatus: "OPEN" | "CLOSED";
};

export type ProfileRecord = {
  email: string;
  studentId: string;
  department: string;
  grade: string;
  bio: string;
  techStack: string;
  collaborationStatus: "OPEN" | "CLOSED";
};

async function getCurrentAppUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    return null;
  }

  const admin = createAdminClient();
  const { data: appUser, error: appUserError } = await admin
    .from("users")
    .select("id, email")
    .eq("auth_user_id", user.id)
    .single();

  if (appUserError) {
    throw new Error(appUserError.message);
  }

  return appUser;
}

export async function getMyProfile() {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return null;
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("student_id, department, grade, bio, tech_stack, collaboration_status")
    .eq("user_id", appUser.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    email: appUser.email,
    studentId: profile.student_id ?? "",
    department: profile.department ?? "",
    grade: profile.grade ?? "",
    bio: profile.bio ?? "",
    techStack: profile.tech_stack ?? "",
    collaborationStatus:
      profile.collaboration_status === "CLOSED" ? "CLOSED" : "OPEN",
  } satisfies ProfileRecord;
}

export async function updateMyProfile(values: ProfileFormValues) {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return null;
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .update({
      student_id: values.studentId || null,
      department: values.department || null,
      grade: values.grade || null,
      bio: values.bio || null,
      tech_stack: values.techStack || null,
      collaboration_status: values.collaborationStatus,
    })
    .eq("user_id", appUser.id)
    .select("student_id, department, grade, bio, tech_stack, collaboration_status")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    email: appUser.email,
    studentId: profile.student_id ?? "",
    department: profile.department ?? "",
    grade: profile.grade ?? "",
    bio: profile.bio ?? "",
    techStack: profile.tech_stack ?? "",
    collaborationStatus:
      profile.collaboration_status === "CLOSED" ? "CLOSED" : "OPEN",
  } satisfies ProfileRecord;
}
