export type TagTone = "default" | "teal" | "blue" | "amber" | "rose" | "green";

export type Campus = string;

export type ProjectStatus = string;

export type Project = {
  id: number;
  title: string;
  campus: Campus;
  role: string;
  status: ProjectStatus;
  summary: string;
  content: string;
  tags: { label: string; tone?: TagTone }[];
  verified: string;
  action: "지원하기" | "제안하기";
  accent: "blue" | "amber" | "green";
  coverImageName?: string;
};

export type Talent = {
  id: number;
  name: string;
  campus: Campus;
  role: string;
  tools: { label: string; tone?: TagTone }[];
  availability: string;
  portfolio: string;
};

export type ApplicationStatus = string;

export type Application = {
  id: number;
  title: string;
  type: "지원" | "제안";
  status: ApplicationStatus;
  meta: string;
};

export type Portfolio = {
  id: number;
  title: string;
  role: string;
  summary: string;
  content: string;
  link?: string;
  coverImageName?: string;
  createdAt: string;
};

export type OnboardingProfile = {
  name: string;
  campus: Campus;
  department: string;
  grade: string;
  email: string;
  roles: string[];
  tools: string;
  availabilityStatus: string;
  collaborationType: string;
  weeklyHours: string;
  completed: boolean;
};
