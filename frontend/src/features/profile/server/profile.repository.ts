import "server-only";

import type { Tables, TablesUpdate } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

import type { ProfileFormValues } from "./profile-me";

type ProfileDataRow = Pick<
  Tables<"profiles">,
  | "student_id"
  | "department"
  | "grade"
  | "bio"
  | "tech_stack"
  | "collaboration_status"
  | "display_name"
  | "role_tags"
  | "availability_status"
  | "collaboration_type"
  | "weekly_hours"
  | "onboarding_completed"
>;

type PortfolioReadinessRow = Pick<Tables<"portfolio_items">, "role_in_work">;

const PROFILE_SELECT =
  "student_id, department, grade, bio, tech_stack, collaboration_status, display_name, role_tags, availability_status, collaboration_type, weekly_hours, onboarding_completed" as const;

const PORTFOLIO_READINESS_SELECT = "role_in_work" as const;

export type ProfileContext = {
  campus: string | null;
  profile: ProfileDataRow;
  portfolioReadiness: PortfolioReadinessRow[];
};

export interface ProfileRepository {
  findContextByUserId(userId: number): Promise<ProfileContext>;
  updateByUserId(userId: number, values: ProfileFormValues): Promise<ProfileDataRow>;
}

function toProfileUpdate(values: ProfileFormValues): TablesUpdate<"profiles"> {
  return {
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
  };
}

export const profileRepository: ProfileRepository = {
  async findContextByUserId(userId) {
    const supabase = await createClient();
    const [
      { data: userRow, error: userError },
      { data: profile, error: profileError },
      { data: portfolios, error: portfoliosError },
    ] = await Promise.all([
      supabase.from("users").select("campus").eq("id", userId).single(),
      supabase.from("profiles").select(PROFILE_SELECT).eq("user_id", userId).single(),
      supabase
        .from("portfolio_items")
        .select(PORTFOLIO_READINESS_SELECT)
        .eq("user_id", userId),
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

    return {
      campus: userRow.campus,
      profile,
      portfolioReadiness: portfolios ?? [],
    };
  },

  async updateByUserId(userId, values) {
    const supabase = await createClient();

    if (values.campus) {
      const { error: campusError } = await supabase
        .from("users")
        .update({ campus: values.campus })
        .eq("id", userId);

      if (campusError) {
        throw new Error(campusError.message);
      }
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(toProfileUpdate(values))
      .eq("user_id", userId)
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return profile;
  },
};
