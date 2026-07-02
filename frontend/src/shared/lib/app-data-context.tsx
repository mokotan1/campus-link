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

type AppDataContextValue = {
  profile: OnboardingProfile;
  setProfile: (profile: OnboardingProfile) => void;
  projects: Project[];
  addProject: (input: NewProjectInput) => void;
  talents: Talent[];
  portfolios: Portfolio[];
  addPortfolio: (input: NewPortfolioInput) => void;
  applications: Application[];
  addApplication: (title: string, type: Application["type"], meta: string) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<OnboardingProfile>(defaultProfile);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [talents] = useState<Talent[]>(initialTalents);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [applications, setApplications] = useState<Application[]>(initialApplications);

  const addProject = useCallback((input: NewProjectInput) => {
    setProjects((current) => {
      const nextId = current.length ? Math.max(...current.map((project) => project.id)) + 1 : 1;
      const accent: Project["accent"] = (["blue", "amber", "green"] as const)[nextId % 3];

      return [
        {
          id: nextId,
          title: input.title,
          campus: input.campus,
          role: input.role,
          status: input.status,
          summary: input.summary,
          content: input.content,
          tags: input.tagLabels.map((label) => ({ label, tone: "blue" as const })),
          verified: "등록 직후 · 검증 대기",
          action: "지원하기",
          accent,
          coverImageName: input.coverImageName,
        },
        ...current,
      ];
    });
  }, []);

  const addPortfolio = useCallback((input: NewPortfolioInput) => {
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
  }, []);

  const addApplication = useCallback((title: string, type: Application["type"], meta: string) => {
    setApplications((current) => {
      if (current.some((item) => item.title === title && item.type === type)) {
        return current;
      }

      return [
        {
          id: Date.now(),
          title,
          type,
          status: "대기",
          meta,
        },
        ...current,
      ];
    });
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
    [profile, projects, addProject, talents, portfolios, addPortfolio, applications, addApplication],
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
