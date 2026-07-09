"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialTalents } from "@/shared/constants";
import type { Application, OnboardingProfile, Portfolio, Project, Talent } from "@/shared/types";

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

type NewProjectInput = {
  title: string;
  campus: Project["campus"];
  role: string;
  status: Project["status"];
  summary: string;
  content: string;
  tagLabels: string[];
  coverImageName?: string;
};

type NewPortfolioInput = {
  title: string;
  role: string;
  summary: string;
  content: string;
  link?: string;
  coverImageName?: string;
};

type NewApplicationInput = {
  title: string;
  type: Application["type"];
  meta: string;
  projectId?: string | number;
  talentId?: string | number;
};

type SaveState = {
  isSaving: boolean;
  error: string | null;
};

const idleState: SaveState = { isSaving: false, error: null };

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  message: string;
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type ProjectApiRecord = {
  id: number;
  title: string;
  summary: string;
  description: string;
  campus: string;
  requiredRoles: string[];
  tools: string[];
  recruitmentStatus: string;
  createdAt: string;
  coverImageName: string | null;
};

type PortfolioApiRecord = {
  id: number;
  title: string;
  description: string;
  externalUrl: string;
  roleInWork: string;
  createdAt: string;
  coverImageName: string | null;
};

type ApplicationApiRecord = {
  id: number;
  projectId: number;
  message: string;
  status: string;
  targetRole: string;
  project: {
    title: string;
    campus: string;
  };
};

type AppDataContextValue = {
  profile: OnboardingProfile;
  setProfile: (profile: OnboardingProfile) => void;
  saveProfile: (profile: OnboardingProfile) => Promise<void>;
  profileSaveState: SaveState;
  projects: Project[];
  createProject: (input: NewProjectInput) => Promise<void>;
  projectSaveState: SaveState;
  talents: Talent[];
  portfolios: Portfolio[];
  createPortfolio: (input: NewPortfolioInput) => Promise<void>;
  portfolioSaveState: SaveState;
  applications: Application[];
  createApplication: (input: NewApplicationInput) => Promise<void>;
  applicationSaveState: SaveState;
  hasApplied: (input: { projectId?: string | number; talentId?: string | number; type: Application["type"] }) => boolean;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function mapProjectStatus(status: string) {
  if (status === "RECRUITING") {
    return "모집중";
  }

  if (status === "CLOSED") {
    return "완료";
  }

  return status || "모집중";
}

function mapApplicationStatus(status: string) {
  if (status === "PENDING") {
    return "대기";
  }

  if (status === "ACCEPTED") {
    return "수락";
  }

  if (status === "REJECTED") {
    return "거절";
  }

  if (status === "CANCELED") {
    return "취소";
  }

  return status || "대기";
}

function mapProjectRecord(record: ProjectApiRecord): Project {
  const tags = [...record.requiredRoles, ...record.tools].filter(Boolean).map((label, index) => ({
    label,
    tone: index < record.requiredRoles.length ? ("blue" as const) : ("default" as const),
  }));

  return {
    id: String(record.id),
    title: record.title,
    campus: record.campus || "캠퍼스 미정",
    author: "Campus Link",
    category: record.requiredRoles[0] ?? "모집 역할 협의",
    recruitingRoles: record.requiredRoles,
    role: record.requiredRoles[0] ?? "모집 역할 협의",
    maxMembers: 0,
    currentMembers: 0,
    deadline: "",
    createdAt: record.createdAt,
    status: mapProjectStatus(record.recruitmentStatus),
    summary: record.summary,
    content: record.description || record.summary,
    tags,
    verified: "실제 API 데이터",
    action: "지원하기",
    accent: (["blue", "amber", "green"] as const)[record.id % 3],
    coverImageName: record.coverImageName ?? undefined,
  };
}

function mapPortfolioRecord(record: PortfolioApiRecord): Portfolio {
  return {
    id: record.id,
    title: record.title,
    role: record.roleInWork || "역할 미입력",
    summary: record.description || "설명 없음",
    content: record.description || "설명 없음",
    link: record.externalUrl || undefined,
    coverImageName: record.coverImageName ?? undefined,
    createdAt: record.createdAt,
  };
}

function mapApplicationRecord(record: ApplicationApiRecord): Application {
  return {
    id: record.id,
    title: record.project.title,
    type: "지원",
    direction: "sent",
    status: mapApplicationStatus(record.status),
    meta: [record.targetRole, record.project.campus, record.message].filter(Boolean).join(" · "),
    projectId: String(record.projectId),
  };
}

async function readApiResponse<T>(response: Response) {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "요청에 실패했습니다." : payload.message);
  }

  return payload.data;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<OnboardingProfile>(defaultOnboardingProfile);
  const [projects, setProjects] = useState<Project[]>([]);
  const [talents] = useState<Talent[]>(initialTalents);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profileSaveState, setProfileSaveState] = useState<SaveState>(idleState);
  const [projectSaveState, setProjectSaveState] = useState<SaveState>(idleState);
  const [portfolioSaveState, setPortfolioSaveState] = useState<SaveState>(idleState);
  const [applicationSaveState, setApplicationSaveState] = useState<SaveState>(idleState);

  const saveProfile = useCallback(async (nextProfile: OnboardingProfile) => {
    setProfileSaveState({ isSaving: true, error: null });
    try {
      setProfile(nextProfile);
      setProfileSaveState({ isSaving: false, error: null });
    } catch {
      setProfileSaveState({ isSaving: false, error: "프로필을 저장하지 못했습니다. 다시 시도해주세요." });
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialProjects() {
      try {
        const records = await readApiResponse<ProjectApiRecord[]>(
          await fetch("/api/projects", { cache: "no-store" })
        );

        if (active) {
          setProjects(records.map(mapProjectRecord));
        }
      } catch (error) {
        console.error(error);
      }
    }

    async function loadInitialPortfolios() {
      try {
        const records = await readApiResponse<PortfolioApiRecord[]>(
          await fetch("/api/portfolios", { cache: "no-store" })
        );

        if (active) {
          setPortfolios(records.map(mapPortfolioRecord));
        }
      } catch (error) {
        console.error(error);
      }
    }

    async function loadInitialApplications() {
      try {
        const records = await readApiResponse<ApplicationApiRecord[]>(
          await fetch("/api/applications/me", { cache: "no-store" })
        );

        if (active) {
          setApplications(records.map(mapApplicationRecord));
        }
      } catch (error) {
        console.error(error);
      }
    }

    void loadInitialProjects();
    void loadInitialPortfolios();
    void loadInitialApplications();

    return () => {
      active = false;
    };
  }, []);

  const createProject = useCallback(async (input: NewProjectInput) => {
    setProjectSaveState({ isSaving: true, error: null });
    try {
      const record = await readApiResponse<ProjectApiRecord>(
        await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: input.title,
            summary: input.summary,
            description: input.content,
            projectType: "GENERAL",
            collaborationMode: "MIXED",
            recruitmentStatus: input.status === "완료" ? "CLOSED" : "RECRUITING",
            campus: input.campus,
            requiredRoles: [input.role],
            tools: input.tagLabels,
            expectedMemberCount: null,
            startDate: "",
            endDate: "",
            coverImageName: input.coverImageName ?? "",
          }),
        })
      );

      setProjects((current) => [mapProjectRecord(record), ...current]);
      setProjectSaveState({ isSaving: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "프로젝트를 등록하지 못했습니다. 다시 시도해주세요.";
      setProjectSaveState({ isSaving: false, error: message });
      throw error;
    }
  }, []);

  const createPortfolio = useCallback(async (input: NewPortfolioInput) => {
    setPortfolioSaveState({ isSaving: true, error: null });
    try {
      const record = await readApiResponse<PortfolioApiRecord>(
        await fetch("/api/portfolios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: input.title,
            description: input.content,
            externalUrl: input.link,
            roleInWork: input.role,
            tools: [],
            coverImageName: input.coverImageName ?? "",
          }),
        })
      );

      setPortfolios((current) => [mapPortfolioRecord(record), ...current]);
      setPortfolioSaveState({ isSaving: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "포트폴리오를 등록하지 못했습니다. 다시 시도해주세요.";
      setPortfolioSaveState({ isSaving: false, error: message });
      throw error;
    }
  }, []);

  const hasApplied = useCallback(
    ({ projectId, talentId, type }: { projectId?: string | number; talentId?: string | number; type: Application["type"] }) => {
      return applications.some((item) => {
        if (item.direction !== "sent" || item.type !== type) return false;
        if (projectId !== undefined) return String(item.projectId) === String(projectId);
        if (talentId !== undefined) return String(item.talentId) === String(talentId);
        return false;
      });
    },
    [applications],
  );

  const createApplication = useCallback(
    async (input: NewApplicationInput) => {
      setApplicationSaveState({ isSaving: true, error: null });
      try {
        if (hasApplied({ projectId: input.projectId, talentId: input.talentId, type: input.type })) {
          setApplicationSaveState({ isSaving: false, error: null });
          return;
        }

        const project = input.projectId
          ? projects.find((item) => String(item.id) === String(input.projectId))
          : undefined;

        if (input.type === "제안" || !input.projectId || !project) {
          setApplications((current) => [
            {
              id: Date.now(),
              title: input.title,
              type: input.type,
              direction: "sent",
              status: "대기",
              meta: input.meta,
              projectId: input.projectId,
              talentId: input.talentId,
            },
            ...current,
          ]);
          setApplicationSaveState({ isSaving: false, error: null });
          return;
        }

        const record = await readApiResponse<ApplicationApiRecord>(
          await fetch("/api/applications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId: Number(input.projectId),
              targetRole: project.role,
              message: `${input.title}에 ${project.role} 역할로 참여하고 싶습니다.`,
            }),
          })
        );

        setApplications((current) => [mapApplicationRecord(record), ...current]);
        setApplicationSaveState({ isSaving: false, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : "지원/제안을 등록하지 못했습니다. 다시 시도해주세요.";
        setApplicationSaveState({ isSaving: false, error: message });
        throw error;
      }
    },
    [hasApplied, projects],
  );

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      saveProfile,
      profileSaveState,
      projects,
      createProject,
      projectSaveState,
      talents,
      portfolios,
      createPortfolio,
      portfolioSaveState,
      applications,
      createApplication,
      applicationSaveState,
      hasApplied,
    }),
    [
      profile,
      saveProfile,
      profileSaveState,
      projects,
      createProject,
      projectSaveState,
      talents,
      portfolios,
      createPortfolio,
      portfolioSaveState,
      applications,
      createApplication,
      applicationSaveState,
      hasApplied,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData는 AppDataProvider 내부에서만 사용할 수 있습니다.");
  }

  return context;
}
