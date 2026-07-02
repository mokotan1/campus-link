export type TagTone = "default" | "teal" | "blue" | "amber" | "rose" | "green";

export type Campus = "대명캠" | "성서캠";

export type ProjectStatus = "모집중" | "진행중" | "완료";

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

export type ApplicationStatus = "대기" | "수락" | "거절" | "취소";

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
