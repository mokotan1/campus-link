"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { initialApplications, initialProjects, initialTalents } from "@/shared/constants";
import type { Application, OnboardingProfile, Portfolio, Project, Talent } from "@/shared/types";

const defaultProfile: OnboardingProfile = {
  name: "",
  campus: "대명캠",
  department: "",
  grade: "1학년",
  email: "",
  roles: [],
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
  projectId?: string;
  talentId?: string;
};

/**
 * 저장 상태(저장 중 / 실패)를 함수별로 추적한다.
 * 지금은 useState 기반이지만, 실제 API(fetch/Supabase)로 교체할 때
 * saveProfile / createProject / createPortfolio / createApplication
 * 함수 내부만 바꾸면 되도록 인터페이스를 맞춰뒀다.
 */
type SaveState = {
  isSaving: boolean;
  error: string | null;
};

const idleState: SaveState = { isSaving: false, error: null };

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
  hasApplied: (input: { projectId?: string; talentId?: string; type: Application["type"] }) => boolean;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<OnboardingProfile>(defaultProfile);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [talents] = useState<Talent[]>(initialTalents);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [applications, setApplications] = useState<Application[]>(initialApplications);

  const [profileSaveState, setProfileSaveState] = useState<SaveState>(idleState);
  const [projectSaveState, setProjectSaveState] = useState<SaveState>(idleState);
  const [portfolioSaveState, setPortfolioSaveState] = useState<SaveState>(idleState);
  const [applicationSaveState, setApplicationSaveState] = useState<SaveState>(idleState);

  // 나중에 fetch("/api/profile", { method: "PUT", body: ... }) 로 교체할 자리.
  const saveProfile = useCallback(async (nextProfile: OnboardingProfile) => {
    setProfileSaveState({ isSaving: true, error: null });
    try {
      setProfile(nextProfile);
      setProfileSaveState({ isSaving: false, error: null });
    } catch {
      setProfileSaveState({ isSaving: false, error: "프로필을 저장하지 못했습니다. 다시 시도해주세요." });
    }
  }, []);

  // 나중에 fetch("/api/projects", { method: "POST", body: ... }) 로 교체할 자리.
  const createProject = useCallback(async (input: NewProjectInput) => {
    setProjectSaveState({ isSaving: true, error: null });
    try {
      setProjects((current) => {
        const nextNumber = current.length + 1;
        const id = `PRJ${String(nextNumber).padStart(3, "0")}-${Date.now().toString().slice(-4)}`;
        const accent: Project["accent"] = (["blue", "amber", "green"] as const)[nextNumber % 3];

        const newProject: Project = {
          id,
          title: input.title,
          campus: input.campus,
          author: "나",
          category: input.role,
          recruitingRoles: [input.role],
          role: input.role,
          maxMembers: 1,
          currentMembers: 0,
          deadline: "",
          createdAt: new Date().toISOString().slice(0, 10),
          status: input.status,
          summary: input.summary,
          content: input.content,
          tags: input.tagLabels.map((label) => ({ label, tone: "blue" as const })),
          verified: "등록 직후 · 검증 대기",
          action: "지원하기",
          accent,
          coverImageName: input.coverImageName,
        };

        return [newProject, ...current];
      });
      setProjectSaveState({ isSaving: false, error: null });
    } catch {
      setProjectSaveState({ isSaving: false, error: "프로젝트를 등록하지 못했습니다. 다시 시도해주세요." });
    }
  }, []);

  // 나중에 fetch("/api/portfolios", { method: "POST", body: ... }) 로 교체할 자리.
  const createPortfolio = useCallback(async (input: NewPortfolioInput) => {
    setPortfolioSaveState({ isSaving: true, error: null });
    try {
      setPortfolios((current) => {
        const nextId = current.length ? Math.max(...current.map((item) => item.id)) + 1 : 1;

        return [
          {
            id: nextId,
            title: input.title,
            role: input.role,
            summary: input.summary,
            content: input.content,
            link: input.link,
            coverImageName: input.coverImageName,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ];
      });
      setPortfolioSaveState({ isSaving: false, error: null });
    } catch {
      setPortfolioSaveState({ isSaving: false, error: "포트폴리오를 등록하지 못했습니다. 다시 시도해주세요." });
    }
  }, []);

  const hasApplied = useCallback(
    ({ projectId, talentId, type }: { projectId?: string; talentId?: string; type: Application["type"] }) => {
      return applications.some((item) => {
        if (item.direction !== "sent" || item.type !== type) return false;
        if (projectId !== undefined) return item.projectId === projectId;
        if (talentId !== undefined) return item.talentId === talentId;
        return false;
      });
    },
    [applications],
  );

  // 나중에 fetch("/api/applications", { method: "POST", body: ... }) 로 교체할 자리.
  const createApplication = useCallback(
    async (input: NewApplicationInput) => {
      setApplicationSaveState({ isSaving: true, error: null });
      try {
        if (hasApplied({ projectId: input.projectId, talentId: input.talentId, type: input.type })) {
          setApplicationSaveState({ isSaving: false, error: null });
          return;
        }

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
      } catch {
        setApplicationSaveState({ isSaving: false, error: "지원/제안을 등록하지 못했습니다. 다시 시도해주세요." });
      }
    },
    [hasApplied],
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
    ],
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
