"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialApplications, initialProjects, initialTalents } from "@/shared/constants";
import type { Application, OnboardingProfile, Portfolio, Project, Talent } from "@/shared/types";

const APP_DATA_STORAGE_KEY = "campus-link:app-data:v1";
const ACTOR_STORAGE_KEY = "campus-link:actor-id:v1";
const PROFILE_STORAGE_PREFIX = "campus-link:profile:v1:";

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

type StoredProject = Project & {
  ownerId?: string;
};

type StoredPortfolio = Portfolio & {
  ownerId?: string;
};

type StoredApplication = Application & {
  senderId?: string;
  recipientId?: string;
};

type StoredAppData = {
  projects: StoredProject[];
  portfolios: StoredPortfolio[];
  applications: StoredApplication[];
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

type SaveState = {
  isSaving: boolean;
  error: string | null;
};

const idleState: SaveState = { isSaving: false, error: null };
const applicationStatuses: Application["status"][] = ["대기", "수락", "거절", "취소"];

type AppDataContextValue = {
  profile: OnboardingProfile;
  setProfile: (profile: OnboardingProfile) => void;
  saveProfile: (profile: OnboardingProfile) => Promise<void>;
  profileSaveState: SaveState;

  projects: Project[];
  createProject: (input: NewProjectInput) => Promise<void>;
  projectSaveState: SaveState;
  isMyProject: (projectId: string) => boolean;

  talents: Talent[];

  portfolios: Portfolio[];
  createPortfolio: (input: NewPortfolioInput) => Promise<void>;
  portfolioSaveState: SaveState;

  applications: Application[];
  createApplication: (input: NewApplicationInput) => Promise<Application | null>;
  cancelApplication: (applicationId: number) => Promise<boolean>;
  applicationSaveState: SaveState;
  hasApplied: (input: { projectId?: string; talentId?: string; type: Application["type"] }) => boolean;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStoredProject(value: unknown): value is StoredProject {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    (value.campus === "대명캠" || value.campus === "성서캠") &&
    typeof value.author === "string" &&
    typeof value.category === "string" &&
    isStringArray(value.recruitingRoles) &&
    typeof value.role === "string" &&
    typeof value.maxMembers === "number" &&
    typeof value.currentMembers === "number" &&
    typeof value.deadline === "string" &&
    typeof value.createdAt === "string" &&
    ["모집중", "진행중", "완료"].includes(String(value.status)) &&
    typeof value.summary === "string" &&
    typeof value.content === "string" &&
    Array.isArray(value.tags) &&
    typeof value.verified === "string" &&
    (value.action === "지원하기" || value.action === "제안하기") &&
    ["blue", "amber", "green"].includes(String(value.accent)) &&
    (value.ownerId === undefined || typeof value.ownerId === "string")
  );
}

function isStoredPortfolio(value: unknown): value is StoredPortfolio {
  if (!isRecord(value)) return false;

  return (
    Number.isSafeInteger(value.id) &&
    typeof value.title === "string" &&
    typeof value.role === "string" &&
    typeof value.summary === "string" &&
    typeof value.content === "string" &&
    (value.link === undefined || typeof value.link === "string") &&
    (value.coverImageName === undefined || typeof value.coverImageName === "string") &&
    typeof value.createdAt === "string" &&
    (value.ownerId === undefined || typeof value.ownerId === "string")
  );
}

function isStoredApplication(value: unknown): value is StoredApplication {
  if (!isRecord(value)) return false;

  return (
    Number.isSafeInteger(value.id) &&
    typeof value.title === "string" &&
    (value.type === "지원" || value.type === "제안") &&
    (value.direction === "sent" || value.direction === "received") &&
    applicationStatuses.includes(value.status as Application["status"]) &&
    typeof value.meta === "string" &&
    (value.projectId === undefined || typeof value.projectId === "string") &&
    (value.talentId === undefined || typeof value.talentId === "string") &&
    (value.senderId === undefined || typeof value.senderId === "string") &&
    (value.recipientId === undefined || typeof value.recipientId === "string")
  );
}

function loadStoredAppData(): StoredAppData | null {
  try {
    const rawValue = window.localStorage.getItem(APP_DATA_STORAGE_KEY);

    if (!rawValue) return null;

    const value: unknown = JSON.parse(rawValue);

    if (!isRecord(value)) return null;

    return {
      projects: Array.isArray(value.projects) ? value.projects.filter(isStoredProject) : initialProjects,
      portfolios: Array.isArray(value.portfolios) ? value.portfolios.filter(isStoredPortfolio) : [],
      applications: Array.isArray(value.applications) ? value.applications.filter(isStoredApplication) : initialApplications,
    };
  } catch {
    return null;
  }
}

function loadStoredProfile(actorId: string): OnboardingProfile | null {
  try {
    const rawValue = window.sessionStorage.getItem(`${PROFILE_STORAGE_PREFIX}${actorId}`);

    if (!rawValue) return null;

    const value: unknown = JSON.parse(rawValue);

    if (!isRecord(value)) return null;

    const campus = value.campus === "성서캠" ? "성서캠" : value.campus === "대명캠" ? "대명캠" : null;

    if (!campus || !isStringArray(value.roles) || typeof value.completed !== "boolean") return null;

    const stringFields = [
      "name",
      "department",
      "grade",
      "email",
      "tools",
      "availabilityStatus",
      "collaborationType",
      "weeklyHours",
    ];

    if (!stringFields.every((field) => typeof value[field] === "string")) return null;

    return {
      name: value.name as string,
      campus,
      department: value.department as string,
      grade: value.grade as string,
      email: value.email as string,
      roles: value.roles,
      tools: value.tools as string,
      availabilityStatus: value.availabilityStatus as string,
      collaborationType: value.collaborationType as string,
      weeklyHours: value.weeklyHours as string,
      completed: value.completed,
    };
  } catch {
    return null;
  }
}

function getOrCreateActorId() {
  const existingActorId = window.sessionStorage.getItem(ACTOR_STORAGE_KEY);

  if (existingActorId) return existingActorId;

  const actorId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(ACTOR_STORAGE_KEY, actorId);
  return actorId;
}

function isActiveApplication(application: Application) {
  return application.status !== "취소";
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<OnboardingProfile>(defaultProfile);
  const [actorId, setActorId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [projects, setProjects] = useState<StoredProject[]>(initialProjects);
  const [allPortfolios, setAllPortfolios] = useState<StoredPortfolio[]>([]);
  const [allApplications, setAllApplications] = useState<StoredApplication[]>(initialApplications);
  const [talents] = useState<Talent[]>(initialTalents);

  const [profileSaveState, setProfileSaveState] = useState<SaveState>(idleState);
  const [projectSaveState, setProjectSaveState] = useState<SaveState>(idleState);
  const [portfolioSaveState, setPortfolioSaveState] = useState<SaveState>(idleState);
  const [applicationSaveState, setApplicationSaveState] = useState<SaveState>(idleState);

  useEffect(() => {
    // 서버와 첫 클라이언트 렌더는 같은 기본값을 사용한다. 이후 microtask에서
    // 브라우저 저장소를 읽어 hydration 불일치 없이 복원한다.
    window.queueMicrotask(() => {
      const nextActorId = getOrCreateActorId();
      setActorId(nextActorId);
      setProfileState(loadStoredProfile(nextActorId) ?? defaultProfile);

      const savedData = loadStoredAppData();

      if (savedData) {
        // 이전 데모 버전에는 소유자 식별자가 없었다. 그 버전에서 직접 등록한
        // 프로젝트(author: "나")와 포트폴리오는 현재 세션 소유 데이터로 이관한다.
        setProjects(
          savedData.projects.map((project) =>
            !project.ownerId && project.author === "나" ? { ...project, ownerId: nextActorId } : project,
          ),
        );
        setAllPortfolios(
          savedData.portfolios.map((portfolio) =>
            portfolio.ownerId ? portfolio : { ...portfolio, ownerId: nextActorId },
          ),
        );
        setAllApplications(savedData.applications);
      }

      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    window.localStorage.setItem(
      APP_DATA_STORAGE_KEY,
      JSON.stringify({ projects, portfolios: allPortfolios, applications: allApplications } satisfies StoredAppData),
    );
  }, [allApplications, allPortfolios, isHydrated, projects]);

  useEffect(() => {
    if (!actorId) return;

    window.sessionStorage.setItem(`${PROFILE_STORAGE_PREFIX}${actorId}`, JSON.stringify(profile));
  }, [actorId, profile]);

  useEffect(() => {
    function syncFromOtherTab(event: StorageEvent) {
      if (event.key !== APP_DATA_STORAGE_KEY || event.storageArea !== window.localStorage) return;

      const savedData = loadStoredAppData();

      if (!savedData) return;

      setProjects(savedData.projects);
      setAllPortfolios(savedData.portfolios);
      setAllApplications(savedData.applications);
    }

    window.addEventListener("storage", syncFromOtherTab);
    return () => window.removeEventListener("storage", syncFromOtherTab);
  }, []);

  const setProfile = useCallback((nextProfile: OnboardingProfile) => {
    setProfileState(nextProfile);
  }, []);

  const saveProfile = useCallback(async (nextProfile: OnboardingProfile) => {
    setProfileSaveState({ isSaving: true, error: null });
    try {
      setProfileState(nextProfile);
      setProfileSaveState(idleState);
    } catch {
      setProfileSaveState({ isSaving: false, error: "프로필을 저장하지 못했습니다. 다시 시도해주세요." });
    }
  }, []);

  const isMyProject = useCallback((projectId: string) => {
    return Boolean(actorId && projects.some((project) => project.id === projectId && project.ownerId === actorId));
  }, [actorId, projects]);

  const createProject = useCallback(async (input: NewProjectInput) => {
    setProjectSaveState({ isSaving: true, error: null });
    try {
      if (!actorId) {
        throw new Error("프로젝트 등록을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
      }

      const nextNumber = projects.length + 1;
      const id = `PRJ${String(nextNumber).padStart(3, "0")}-${Date.now().toString().slice(-4)}`;
      const accent: Project["accent"] = (["blue", "amber", "green"] as const)[nextNumber % 3];

      const newProject: StoredProject = {
        id,
        title: input.title,
        campus: input.campus,
        author: profile.name.trim() || "나",
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
        ownerId: actorId,
      };

      setProjects((current) => [newProject, ...current]);
      setProjectSaveState(idleState);
    } catch (error) {
      setProjectSaveState({
        isSaving: false,
        error: error instanceof Error ? error.message : "프로젝트를 등록하지 못했습니다. 다시 시도해주세요.",
      });
    }
  }, [actorId, profile.name, projects.length]);

  const portfolios = useMemo(
    () => allPortfolios.filter((portfolio) => !portfolio.ownerId || portfolio.ownerId === actorId),
    [actorId, allPortfolios],
  );

  const createPortfolio = useCallback(async (input: NewPortfolioInput) => {
    setPortfolioSaveState({ isSaving: true, error: null });
    try {
      if (!actorId) {
        throw new Error("포트폴리오 등록을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
      }

      const nextId = allPortfolios.length ? Math.max(...allPortfolios.map((item) => item.id)) + 1 : 1;
      const newPortfolio: StoredPortfolio = {
        id: nextId,
        title: input.title,
        role: input.role,
        summary: input.summary,
        content: input.content,
        link: input.link,
        coverImageName: input.coverImageName,
        createdAt: new Date().toISOString(),
        ownerId: actorId,
      };

      setAllPortfolios((current) => [newPortfolio, ...current]);
      setPortfolioSaveState(idleState);
    } catch (error) {
      setPortfolioSaveState({
        isSaving: false,
        error: error instanceof Error ? error.message : "포트폴리오를 등록하지 못했습니다. 다시 시도해주세요.",
      });
    }
  }, [actorId, allPortfolios]);

  const applications = useMemo(() => {
    return allApplications
      .filter((application) => {
        if (!application.senderId && !application.recipientId) return true;
        return application.senderId === actorId || application.recipientId === actorId;
      })
      .map((application) => {
        if (application.senderId === actorId) {
          return { ...application, direction: "sent" as const };
        }

        if (application.recipientId === actorId) {
          return { ...application, direction: "received" as const };
        }

        return application;
      });
  }, [actorId, allApplications]);

  const hasApplied = useCallback(
    ({ projectId, talentId, type }: { projectId?: string; talentId?: string; type: Application["type"] }) => {
      return allApplications.some((application) => {
        const isCurrentUsersRequest = application.senderId ? application.senderId === actorId : application.direction === "sent";

        if (!isCurrentUsersRequest || application.type !== type || !isActiveApplication(application)) return false;
        if (projectId !== undefined) return application.projectId === projectId;
        if (talentId !== undefined) return application.talentId === talentId;
        return false;
      });
    },
    [actorId, allApplications],
  );

  const createApplication = useCallback(async (input: NewApplicationInput) => {
    setApplicationSaveState({ isSaving: true, error: null });
    try {
      if (!actorId) {
        throw new Error("지원/제안을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
      }

      if (hasApplied({ projectId: input.projectId, talentId: input.talentId, type: input.type })) {
        setApplicationSaveState(idleState);
        return null;
      }

      let recipientId: string | undefined;

      if (input.type === "지원") {
        const project = projects.find((item) => item.id === input.projectId);

        if (!project) {
          throw new Error("프로젝트를 찾을 수 없습니다.");
        }

        if (project.ownerId === actorId) {
          throw new Error("내 프로젝트에는 지원할 수 없습니다.");
        }

        recipientId = project.ownerId;
      } else if (input.talentId) {
        recipientId = `talent:${input.talentId}`;
      }

      const newApplication: StoredApplication = {
        id: Date.now(),
        title: input.title,
        type: input.type,
        direction: "sent",
        status: "대기",
        meta: input.meta,
        projectId: input.projectId,
        talentId: input.talentId,
        senderId: actorId,
        recipientId,
      };

      setAllApplications((current) => [newApplication, ...current]);
      setApplicationSaveState(idleState);
      return newApplication;
    } catch (error) {
      setApplicationSaveState({
        isSaving: false,
        error: error instanceof Error ? error.message : "지원/제안을 등록하지 못했습니다. 다시 시도해주세요.",
      });
      return null;
    }
  }, [actorId, hasApplied, projects]);

  const cancelApplication = useCallback(async (applicationId: number) => {
    setApplicationSaveState({ isSaving: true, error: null });
    try {
      const application = allApplications.find((item) => item.id === applicationId);
      const isOwnedByCurrentUser = application?.senderId ? application.senderId === actorId : application?.direction === "sent";

      if (!application || !isOwnedByCurrentUser) {
        throw new Error("취소할 수 있는 요청을 찾을 수 없습니다.");
      }

      if (application.status !== "대기") {
        throw new Error("대기 중인 지원 또는 제안만 취소할 수 있습니다.");
      }

      setAllApplications((current) =>
        current.map((item) => (item.id === applicationId ? { ...item, status: "취소" as const } : item)),
      );
      setApplicationSaveState(idleState);
      return true;
    } catch (error) {
      setApplicationSaveState({
        isSaving: false,
        error: error instanceof Error ? error.message : "지원/제안을 취소하지 못했습니다. 다시 시도해주세요.",
      });
      return false;
    }
  }, [actorId, allApplications]);

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      saveProfile,
      profileSaveState,
      projects,
      createProject,
      projectSaveState,
      isMyProject,
      talents,
      portfolios,
      createPortfolio,
      portfolioSaveState,
      applications,
      createApplication,
      cancelApplication,
      applicationSaveState,
      hasApplied,
    }),
    [
      applications,
      applicationSaveState,
      cancelApplication,
      createApplication,
      createPortfolio,
      createProject,
      hasApplied,
      isMyProject,
      portfolios,
      portfolioSaveState,
      profile,
      profileSaveState,
      projectSaveState,
      projects,
      saveProfile,
      setProfile,
      talents,
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
