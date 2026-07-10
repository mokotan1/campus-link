import { listMyApplications } from "@/features/applications/server/applications";
import { listMyPortfolios } from "@/features/portfolios/server/portfolios";
import { getMyProfile } from "@/features/profile/server/profile-me";
import { listProjects } from "@/features/projects/server/projects";
import { ProjectsScreen } from "@/features/projects/components/projects-screen";
import type { Campus, OnboardingProfile } from "@/shared/types";
import {
  mapApplicationRecord,
  mapPortfolioRecord,
  mapProjectRecord,
} from "@/shared/lib/ui-mappers";

function mapProfileToOnboardingSummary(
  profile: NonNullable<Awaited<ReturnType<typeof getMyProfile>>>,
): OnboardingProfile {
  return {
    name: profile.displayName,
    campus: (profile.campus || "대명캠") as Campus,
    department: profile.department,
    grade: profile.grade || "1학년",
    email: profile.email,
    roles: profile.roleTags,
    tools: profile.techStack,
    availabilityStatus: profile.availabilityStatus || "바로 가능",
    collaborationType: profile.collaborationType || "졸업작품",
    weeklyHours: profile.weeklyHours || "4-7시간",
    completed: profile.onboardingCompleted,
  };
}

export default async function ProjectsPage() {
  const [projectRecords, portfolioRecords, applicationRecords, profileRecord] = await Promise.all([
    listProjects({ query: "", campus: "", role: "", status: "" }),
    listMyPortfolios(),
    listMyApplications(),
    getMyProfile(),
  ]);

  const initialProjects = projectRecords.map(mapProjectRecord);
  const initialPortfolios = (portfolioRecords ?? []).map(mapPortfolioRecord);
  const initialApplications = (applicationRecords ?? []).map(mapApplicationRecord);
  const profile = profileRecord ? mapProfileToOnboardingSummary(profileRecord) : null;

  return (
    <ProjectsScreen
      initialProjects={initialProjects}
      initialPortfolios={initialPortfolios}
      initialApplications={initialApplications}
      profile={profile}
    />
  );
}
