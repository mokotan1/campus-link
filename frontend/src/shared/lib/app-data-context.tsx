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

const defaultProfile: OnboardingProfile = {
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

type AddApplicationInput = {
  projectId?: number;
  title: string;
  type: Application["type"];
  meta: string;
  targetRole?: string;
  message?: string;
};

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
};

type PortfolioApiRecord = {
  id: number;
  title: string;
  description: string;
  externalUrl: string;
  roleInWork: string;
  createdAt: string;
};

type ApplicationApiRecord = {
  id: number;
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
  projects: Project[];
  addProject: (input: NewProjectInput) => Promise<void>;
  talents: Talent[];
  portfolios: Portfolio[];
  addPortfolio: (input: NewPortfolioInput) => Promise<void>;
  applications: Application[];
  addApplication: (input: AddApplicationInput) => Promise<void>;
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
    id: record.id,
    title: record.title,
    campus: record.campus || "캠퍼스 미정",
    role: record.requiredRoles[0] ?? "모집 역할 협의",
    status: mapProjectStatus(record.recruitmentStatus),
    summary: record.summary,
    content: record.description || record.summary,
    tags,
    verified: "실제 API 데이터",
    action: "지원하기",
    accent: (["blue", "amber", "green"] as const)[record.id % 3],
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
    createdAt: record.createdAt,
  };
}

function mapApplicationRecord(record: ApplicationApiRecord): Application {
  return {
    id: record.id,
    title: record.project.title,
    type: "지원",
    status: mapApplicationStatus(record.status),
    meta: [record.targetRole, record.project.campus, record.message].filter(Boolean).join(" · "),
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
  const [profile, setProfile] = useState<OnboardingProfile>(defaultProfile);
  const [projects, setProjects] = useState<Project[]>([]);
  const [talents] = useState<Talent[]>(initialTalents);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const loadProjects = useCallback(async () => {
    try {
      const records = await readApiResponse<ProjectApiRecord[]>(
        await fetch("/api/projects", { cache: "no-store" })
      );
      setProjects(records.map(mapProjectRecord));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadPortfolios = useCallback(async () => {
    try {
      const records = await readApiResponse<PortfolioApiRecord[]>(
        await fetch("/api/portfolios", { cache: "no-store" })
      );
      setPortfolios(records.map(mapPortfolioRecord));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    try {
      const records = await readApiResponse<ApplicationApiRecord[]>(
        await fetch("/api/applications/me", { cache: "no-store" })
      );
      setApplications(records.map(mapApplicationRecord));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
    void loadPortfolios();
    void loadApplications();
  }, [loadApplications, loadPortfolios, loadProjects]);

  const addProject = useCallback(async (input: NewProjectInput) => {
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
        }),
      })
    );

    setProjects((current) => [mapProjectRecord(record), ...current]);
  }, []);

  const addPortfolio = useCallback(async (input: NewPortfolioInput) => {
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
        }),
      })
    );

    setPortfolios((current) => [mapPortfolioRecord(record), ...current]);
  }, []);

  const addApplication = useCallback(async (input: AddApplicationInput) => {
    if (input.type === "제안" || !input.projectId || !input.targetRole) {
      setApplications((current) => [
        {
          id: Date.now(),
          title: input.title,
          type: input.type,
          status: "대기",
          meta: input.meta,
        },
        ...current,
      ]);
      return;
    }

    const record = await readApiResponse<ApplicationApiRecord>(
      await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: input.projectId,
          targetRole: input.targetRole,
          message: input.message ?? "",
        }),
      })
    );

    setApplications((current) => [mapApplicationRecord(record), ...current]);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      projects,
      addProject,
      talents,
      portfolios,
      addPortfolio,
      applications,
      addApplication,
    }),
    [profile, projects, addProject, talents, portfolios, addPortfolio, applications, addApplication]
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
