export type TagTone = "default" | "teal" | "blue" | "amber" | "rose" | "green";

export type Campus = string;

export type ProjectStatus = string;

export type Project = {
  id: string | number;
  ownerUserId?: string | number;
  title: string;
  campus: Campus;
  /** 작성자 (projects.csv: author) */
  author: string;
  /** 카테고리 (projects.csv: category) */
  category: string;
  /** 모집 역할 전체 목록 (projects.csv: recruiting_roles) */
  recruitingRoles: string[];
  /** 대표 역할 (필터/카드 표시용, recruitingRoles[0]) */
  role: string;
  maxMembers: number;
  currentMembers: number;
  /** ISO date (YYYY-MM-DD) */
  deadline: string;
  /** ISO date (YYYY-MM-DD) */
  createdAt: string;
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
  id: string | number;
  name: string;
  studentNumber: string;
  campus: Campus;
  major: string;
  grade: string;
  /** 대표 역할 (카드/필터 표시용, major 또는 skills 기반) */
  role: string;
  interests: string[];
  skills: string[];
  introduction: string;
  email: string;
  tools: { label: string; tone?: TagTone }[];
  availability: string;
  portfolio: string;
  profileId?: string | number;
};

export type ApplicationStatus = string;

export type Application = {
  id: number;
  title: string;
  type: "지원" | "제안";
  /** sent: 내가 보낸 지원/제안, received: 내가 받은 지원/제안 */
  direction: "sent" | "received";
  status: ApplicationStatus;
  meta: string;
  projectId?: string | number;
  talentId?: string | number;
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
