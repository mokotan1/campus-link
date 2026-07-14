import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/features/auth/server/current-app-user";

export type RecommendedTalentRecord = {
  id: number;
  name: string;
  studentNumber: string;
  campus: string;
  major: string;
  grade: string;
  role: string;
  interests: string[];
  skills: string[];
  introduction: string;
  email: string;
  tools: string[];
  availability: string;
  portfolio: string;
};

type ProfileRow = {
  id: number;
  user_id: number;
  student_id: string | null;
  department: string | null;
  grade: string | null;
  bio: string | null;
  tech_stack: string | null;
  display_name: string | null;
  role_tags: string[] | null;
  availability_status: string | null;
  collaboration_type: string | null;
  weekly_hours: string | null;
  collaboration_status: string;
  onboarding_completed: boolean;
};

type UserRow = {
  id: number;
  email: string;
  campus: string | null;
  name: string | null;
};

type PortfolioRow = {
  user_id: number;
  title: string;
  description: string | null;
  external_url: string | null;
  role_in_work: string | null;
  tools: string[] | null;
};

function splitTechStack(value: string | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function formatGrade(grade: string | null) {
  const normalized = String(grade ?? "").trim();

  if (!normalized) {
    return "학년 미입력";
  }

  return normalized.endsWith("학년") ? normalized : `${normalized}학년`;
}

function formatAvailability(profile: ProfileRow) {
  const parts = [profile.availability_status, profile.weekly_hours]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);

  return parts.join(" · ") || "협업 가능 상태 미입력";
}

export async function listRecommendedTalents() {
  const currentUser = await getCurrentAppUser();
  const admin = createAdminClient();
  let profileQuery = admin
    .from("profiles")
    .select(
      "id, user_id, student_id, department, grade, bio, tech_stack, display_name, role_tags, availability_status, collaboration_type, weekly_hours, collaboration_status, onboarding_completed"
    )
    .eq("onboarding_completed", true)
    .eq("collaboration_status", "OPEN")
    .order("id", { ascending: false })
    .limit(24);

  if (currentUser) {
    profileQuery = profileQuery.neq("user_id", currentUser.id);
  }

  const { data: profiles, error: profilesError } = await profileQuery;

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileRows = (profiles ?? []) as ProfileRow[];
  const userIds = [...new Set(profileRows.map((profile) => profile.user_id))];

  if (userIds.length === 0) {
    return [];
  }

  const [{ data: users, error: usersError }, { data: portfolios, error: portfoliosError }] =
    await Promise.all([
      admin.from("users").select("id, email, campus, name").in("id", userIds),
      admin
        .from("portfolio_items")
        .select("user_id, title, description, external_url, role_in_work, tools")
        .in("user_id", userIds)
        .order("created_at", { ascending: false }),
    ]);

  if (usersError) {
    throw new Error(usersError.message);
  }

  if (portfoliosError) {
    throw new Error(portfoliosError.message);
  }

  const userMap = new Map((users ?? []).map((user) => [user.id, user as UserRow]));
  const portfolioMap = new Map<number, PortfolioRow[]>();

  for (const portfolio of (portfolios ?? []) as PortfolioRow[]) {
    const current = portfolioMap.get(portfolio.user_id) ?? [];
    current.push(portfolio);
    portfolioMap.set(portfolio.user_id, current);
  }

  return profileRows.map((profile) => {
    const user = userMap.get(profile.user_id);
    const userPortfolios = portfolioMap.get(profile.user_id) ?? [];
    const leadPortfolio = userPortfolios[0];
    const skills = uniqueStrings([
      ...(profile.role_tags ?? []),
      ...splitTechStack(profile.tech_stack),
      ...((leadPortfolio?.tools ?? []).map((item) => String(item).trim()).filter(Boolean)),
    ]);

    return {
      id: profile.id,
      name:
        String(profile.display_name ?? "").trim() ||
        String(user?.name ?? "").trim() ||
        String(user?.email ?? "").split("@")[0] ||
        "이름 미입력",
      studentNumber: profile.student_id ?? "",
      campus: user?.campus ?? "캠퍼스 미입력",
      major: profile.department ?? "학과 미입력",
      grade: formatGrade(profile.grade),
      role: profile.role_tags?.[0] ?? profile.department ?? "역할 미입력",
      interests: profile.collaboration_type ? [profile.collaboration_type] : [],
      skills,
      introduction:
        String(profile.bio ?? "").trim() ||
        String(leadPortfolio?.description ?? "").trim() ||
        "소개가 아직 등록되지 않았습니다.",
      email: user?.email ?? "",
      tools: skills,
      availability: formatAvailability(profile),
      portfolio:
        leadPortfolio?.external_url ||
        String(leadPortfolio?.title ?? "").trim() ||
        "",
    } satisfies RecommendedTalentRecord;
  });
}
