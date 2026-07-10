import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

import type {
  ProfileRecommendationCandidate,
  ProjectRecommendationCandidate,
  ProjectRecommendationContext,
  ViewerRecommendationContext,
} from "./recommendations";

function parseToolTags(techStack: string | null | undefined) {
  if (!techStack?.trim()) {
    return [];
  }

  return techStack
    .split(/[,/|]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

type ProjectRow = Pick<
  Tables<"projects">,
  | "id"
  | "owner_user_id"
  | "title"
  | "summary"
  | "campus"
  | "required_roles"
  | "tools"
  | "recruitment_status"
  | "end_date"
  | "created_at"
>;

type ProfileRow = Pick<
  Tables<"profiles">,
  | "user_id"
  | "display_name"
  | "role_tags"
  | "tech_stack"
  | "availability_status"
  | "created_at"
>;

type UserCampusRow = Pick<Tables<"users">, "id" | "campus">;

type PortfolioVisibilityRow = Pick<Tables<"portfolio_items">, "user_id" | "external_url">;

const PROJECT_SELECT =
  "id, owner_user_id, title, summary, campus, required_roles, tools, recruitment_status, end_date, created_at" as const;

const PROFILE_SELECT =
  "user_id, display_name, role_tags, tech_stack, availability_status, created_at" as const;

function mapProjectRow(row: ProjectRow): ProjectRecommendationCandidate {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    title: row.title,
    summary: row.summary,
    campus: row.campus,
    requiredRoles: row.required_roles ?? [],
    tools: row.tools ?? [],
    recruitmentStatus: row.recruitment_status,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

function mapProfileRow(
  row: ProfileRow,
  campusByUserId: Map<number, string | null>,
  publicPortfolioUserIds: Set<number>,
): ProfileRecommendationCandidate {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    campus: campusByUserId.get(row.user_id) ?? null,
    roleTags: row.role_tags ?? [],
    toolTags: parseToolTags(row.tech_stack),
    availabilityStatus: row.availability_status,
    hasPublicPortfolio: publicPortfolioUserIds.has(row.user_id),
    profileCreatedAt: row.created_at,
  };
}

export interface RecommendationRepository {
  findViewerContext(
    userId: number,
  ): Promise<{ viewer: ViewerRecommendationContext; projects: ProjectRecommendationCandidate[] }>;
  findProjectRecommendationContext(
    ownerUserId: number,
    projectId: number,
  ): Promise<{ project: ProjectRecommendationContext; profiles: ProfileRecommendationCandidate[] } | null>;
}

export const recommendationRepository: RecommendationRepository = {
  async findViewerContext(userId) {
    const supabase = await createClient();

    const [
      { data: userRow, error: userError },
      { data: profile, error: profileError },
      { data: projects, error: projectsError },
      { data: applications, error: applicationsError },
    ] = await Promise.all([
      supabase.from("users").select("id, campus").eq("id", userId).single(),
      supabase
        .from("profiles")
        .select("display_name, role_tags, tech_stack")
        .eq("user_id", userId)
        .single(),
      supabase.from("projects").select(PROJECT_SELECT).order("created_at", { ascending: false }),
      supabase.from("applications").select("project_id").eq("applicant_user_id", userId),
    ]);

    if (userError) {
      throw new Error(userError.message);
    }

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (projectsError) {
      throw new Error(projectsError.message);
    }

    if (applicationsError) {
      throw new Error(applicationsError.message);
    }

    const viewer: ViewerRecommendationContext = {
      userId,
      campus: userRow.campus,
      displayName: profile.display_name,
      roleTags: profile.role_tags ?? [],
      toolTags: parseToolTags(profile.tech_stack),
      appliedProjectIds: [...new Set((applications ?? []).map((item) => item.project_id))],
    };

    return {
      viewer,
      projects: (projects ?? []).map(mapProjectRow),
    };
  },

  async findProjectRecommendationContext(ownerUserId, projectId) {
    const supabase = await createClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      throw new Error(projectError.message);
    }

    if (!project) {
      return null;
    }

    const [
      { data: profiles, error: profilesError },
      { data: users, error: usersError },
      { data: portfolios, error: portfoliosError },
    ] = await Promise.all([
      supabase.from("profiles").select(PROFILE_SELECT).neq("user_id", ownerUserId),
      supabase.from("users").select("id, campus").neq("id", ownerUserId),
      supabase
        .from("portfolio_items")
        .select("user_id, external_url")
        .not("external_url", "is", null),
    ]);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    if (usersError) {
      throw new Error(usersError.message);
    }

    if (portfoliosError) {
      throw new Error(portfoliosError.message);
    }

    const campusByUserId = new Map(
      ((users ?? []) as UserCampusRow[]).map((row) => [row.id, row.campus]),
    );

    const publicPortfolioUserIds = new Set(
      ((portfolios ?? []) as PortfolioVisibilityRow[])
        .filter((item) => Boolean(item.external_url?.trim()))
        .map((item) => item.user_id),
    );

    return {
      project: {
        id: project.id,
        ownerUserId: project.owner_user_id,
        campus: project.campus,
        requiredRoles: project.required_roles ?? [],
        tools: project.tools ?? [],
      } satisfies ProjectRecommendationContext,
      profiles: (profiles ?? []).map((row) =>
        mapProfileRow(row, campusByUserId, publicPortfolioUserIds),
      ),
    };
  },
};
