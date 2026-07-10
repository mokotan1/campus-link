import type { OnboardingProfile } from "@/shared/types";

export const defaultOnboardingProfile: OnboardingProfile = {
  name: "",
  campus: "대명캠",
  department: "",
  grade: "1학년",
  email: "",
  roles: ["개발", "2D 아트"],
  tools: "",
  availabilityStatus: "바로 가능",
  collaborationType: "졸업작품",
  weeklyHours: "4-7시간",
  completed: false,
};
