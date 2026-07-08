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
