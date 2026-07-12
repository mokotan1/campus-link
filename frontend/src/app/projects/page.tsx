"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Tag, StatusBadge } from "@/shared/components/tag";
import { campuses, projectMediaClass, roleFilters, statusFilters } from "@/shared/constants";
import { useAppData } from "@/shared/lib/app-data-context";

type Tab = "projects" | "portfolio";

export default function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsPageContent />
    </Suspense>
  );
}

function ProjectsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isInitializing,
    profile,
    projects,
    talents,
    portfolios,
    createApplication,
    hasApplied,
    applicationSaveState,
  } =
    useAppData();

  const initialTab: Tab = searchParams.get("tab") === "portfolio" ? "portfolio" : "projects";
  const createdBanner = searchParams.get("created");

  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState("");
  const [campusFilter, setCampusFilter] = useState("전체 캠퍼스");
  const [roleFilter, setRoleFilter] = useState("모든 역할");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [justApplied, setJustApplied] = useState<string | null>(null);
  const createHref = tab === "projects" ? "/projects/new" : "/projects/portfolio/new";

  const filteredProjects = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return projects.filter((project) => {
      const searchable = [
        project.title,
        project.summary,
        project.content,
        project.author,
        project.category,
        project.role,
        project.campus,
        project.status,
        ...project.recruitingRoles,
        ...project.tags.map((tag) => tag.label),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || searchable.includes(keyword)) &&
        (campusFilter === "전체 캠퍼스" || project.campus === campusFilter) &&
        (roleFilter === "모든 역할" ||
          project.recruitingRoles.includes(roleFilter) ||
          project.tags.some((tag) => tag.label.includes(roleFilter))) &&
        (statusFilter === "전체 상태" || project.status === statusFilter)
      );
    });
  }, [campusFilter, projects, query, roleFilter, statusFilter]);

  async function handleApplyToProject(project: (typeof projects)[number]) {
    try {
      await createApplication({
        title: project.title,
        type: "지원",
        meta: `${project.role} 역할 · ${project.campus}`,
        projectId: project.id,
      });
      setJustApplied(project.title);
      window.setTimeout(() => setJustApplied((current) => (current === project.title ? null : current)), 2500);
    } catch {
      // Error state is displayed from applicationSaveState.
    }
  }

  async function handleProposeToTalent(talent: (typeof talents)[number]) {
    try {
      await createApplication({
        title: talent.name,
        type: "제안",
        meta: `${talent.role} · ${talent.availability}`,
        talentId: talent.id,
      });
      setJustApplied(talent.name);
      window.setTimeout(() => setJustApplied((current) => (current === talent.name ? null : current)), 2500);
    } catch {
      // Error state is displayed from applicationSaveState.
    }
  }

  function clearCreatedBanner() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("created");
    router.replace(`/projects${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-16 text-slate-950">
      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-10 lg:py-14">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">Projects</p>
            <h1 className="mt-2 text-3xl font-black tracking-[0] sm:text-4xl">프로젝트 · 포트폴리오</h1>
            <p className="mt-2 max-w-2xl leading-7 text-slate-600">
              팀을 찾는 프로젝트를 등록하고, 내 작업물은 포트폴리오 탭에서 블로그처럼 정리하세요.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-extrabold text-white transition hover:bg-slate-800"
            href={createHref}
          >
            {tab === "projects" ? "프로젝트 등록" : "포트폴리오 작성"}
          </Link>
        </div>

        {createdBanner && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-extrabold text-teal-800">
            <span>
              {createdBanner === "project" ? "프로젝트가 등록되었습니다. 목록 상단에서 확인하세요." : "포트폴리오가 등록되었습니다."}
            </span>
            <button type="button" className="text-teal-700 underline underline-offset-2" onClick={clearCreatedBanner}>
              닫기
            </button>
          </div>
        )}

        <div className="mt-8 inline-flex rounded-lg border border-slate-200 bg-white p-1" role="tablist" aria-label="프로젝트 페이지 탭">
          <button
            className={`min-h-10 rounded-lg px-4 text-sm font-extrabold transition ${
              tab === "projects" ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
            }`}
            type="button"
            role="tab"
            aria-selected={tab === "projects"}
            onClick={() => setTab("projects")}
          >
            프로젝트
          </button>
          <button
            className={`min-h-10 rounded-lg px-4 text-sm font-extrabold transition ${
              tab === "portfolio" ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
            }`}
            type="button"
            role="tab"
            aria-selected={tab === "portfolio"}
            onClick={() => setTab("portfolio")}
          >
            포트폴리오
          </button>
        </div>

        {tab === "projects" ? (
          <div className="mt-6">
            <div className="grid gap-3 md:grid-cols-[1.4fr_repeat(3,minmax(140px,1fr))]">
              <input
                className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                placeholder="프로젝트명, 작성자, 카테고리, 역할, 본문 검색"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none" value={campusFilter} onChange={(event) => setCampusFilter(event.target.value)}>
                {campuses.map((campus) => (
                  <option key={campus}>{campus}</option>
                ))}
              </select>
              <select className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                {roleFilters.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
              <select className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {statusFilters.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black">팀원 모집</h2>
                  <span className="text-sm font-extrabold text-slate-500">{filteredProjects.length}개 프로젝트</span>
                </div>
                {isInitializing ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
                    프로젝트 목록을 불러오고 있습니다.
                  </div>
                ) : (
                <div className="grid gap-4">
                  {filteredProjects.map((project) => {
                    const applied = hasApplied({ projectId: project.id, type: "지원" });

                    return (
                      <article
                        className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-slate-300 md:grid md:min-h-48 md:grid-cols-[190px_1fr]"
                        key={project.id}
                      >
                        <Link
                          href={`/projects/${project.id}`}
                          className={`relative block min-h-40 bg-gradient-to-br ${projectMediaClass[project.accent]}`}
                          aria-hidden="true"
                          tabIndex={-1}
                        >
                          <span className="absolute bottom-7 left-7 h-20 w-14 rounded-t-full rounded-b-lg bg-slate-950 shadow-[66px_12px_0_-22px_#0f766e,112px_-16px_0_-28px_#be123c]" />
                          <span className="absolute right-5 top-5 h-16 w-20 rounded-lg border border-white/80 bg-white/50" />
                        </Link>
                        <div className="grid gap-4 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="mb-2 flex flex-wrap gap-2">
                                <Tag label={project.campus} tone="green" />
                                <StatusBadge status={project.status} />
                              </div>
                              <Link href={`/projects/${project.id}`} className="hover:underline">
                                <h3 className="text-xl font-black tracking-[0]">{project.title}</h3>
                              </Link>
                              <p className="mt-1 text-xs font-bold text-slate-500">
                                {project.author} · {project.category} · 모집 역할 {project.recruitingRoles.join(", ")}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{project.summary}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag) => (
                              <Tag key={tag.label} label={tag.label} tone={tag.tone} />
                            ))}
                          </div>
                          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-bold text-slate-500">
                              <span className="font-black text-emerald-700">{project.verified}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {justApplied === project.title && (
                                <span className="text-xs font-extrabold text-teal-700">
                                  <Link href="/applications" className="underline underline-offset-2">
                                    지원 완료 · 현황 보기
                                  </Link>
                                </span>
                              )}
                              <button
                                className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-extrabold text-slate-950 transition hover:border-teal-700 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                                type="button"
                                disabled={applied || applicationSaveState.isSaving}
                                onClick={() => void handleApplyToProject(project)}
                              >
                                {applied ? "지원 완료" : "지원하기"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-bold text-slate-500">
                      조건에 맞는 프로젝트가 없습니다. 검색어나 필터를 조정해보세요.
                    </p>
                  )}
                </div>
                )}
              </div>

              <aside className="grid content-start gap-5">
                {profile.completed && (
                  <section className="rounded-lg border border-teal-200 bg-teal-50/60 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-700">내 프로필 요약</p>
                    <h3 className="mt-2 text-lg font-black text-slate-950">
                      {profile.name || "이름 미입력"} · {profile.campus}
                    </h3>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {profile.department || "학과 미입력"} · {profile.grade}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profile.roles.map((role) => (
                        <Tag key={role} label={role} tone="teal" />
                      ))}
                      <Tag label={profile.collaborationType} tone="amber" />
                      <Tag label={profile.availabilityStatus} />
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-500">주당 {profile.weeklyHours} 협업 가능</p>
                  </section>
                )}
                <section>
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h2 className="text-xl font-black">추천 인재</h2>
                    <span className="text-sm font-extrabold text-slate-500">검증 프로필</span>
                  </div>
                  {isInitializing ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
                      추천 인재를 불러오고 있습니다.
                    </div>
                  ) : (
                  <div className="grid gap-4">
                    {talents.slice(0, 6).map((talent) => {
                      const proposed = hasApplied({ talentId: talent.id, type: "제안" });

                      return (
                        <article className="rounded-lg border border-slate-200 bg-white p-5" key={talent.id}>
                          <div className="grid grid-cols-[58px_1fr] gap-3">
                            <div className="relative size-14 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-rose-100" aria-hidden="true">
                              <span className="absolute left-5 top-3 size-5 rounded-full bg-slate-950 shadow-[0_22px_0_9px_#0f172a]" />
                            </div>
                            <div>
                              <h3 className="text-lg font-black">{talent.name}</h3>
                              <p className="mt-1 text-sm font-bold text-slate-500">
                                {talent.campus} · {talent.major} · {talent.grade}
                              </p>
                            </div>
                          </div>
                          <p className="mt-4 text-sm leading-6 text-slate-600">{talent.introduction}</p>
                          {talent.interests.length > 0 && (
                            <p className="mt-2 text-xs font-bold text-slate-500">관심 분야 · {talent.interests.join(", ")}</p>
                          )}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {talent.tools.map((tag) => (
                              <Tag key={tag.label} label={tag.label} tone={tag.tone} />
                            ))}
                          </div>
                          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
                            <span className="text-sm font-bold text-slate-500">{talent.availability}</span>
                            <button
                              className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                              type="button"
                              disabled={proposed || applicationSaveState.isSaving}
                              onClick={() => void handleProposeToTalent(talent)}
                            >
                              {proposed ? "제안 완료" : "제안하기"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  )}
                </section>
              </aside>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {!isInitializing && portfolios.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-sm font-bold text-slate-500">아직 작성한 포트폴리오가 없습니다.</p>
                <Link href="/projects/portfolio/new" className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-teal-700 px-4 text-sm font-extrabold text-white">
                  첫 포트폴리오 작성하기
                </Link>
              </div>
            )}
            {isInitializing && (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
                포트폴리오를 불러오고 있습니다.
              </div>
            )}
            {portfolios.map((item) => (
              <article className="overflow-hidden rounded-lg border border-slate-200 bg-white" key={item.id}>
                {item.coverImageName && (
                  <div className="flex h-10 items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 text-xs font-bold text-slate-500">
                    첨부 이미지 · {item.coverImageName}
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Tag label={item.role} tone="blue" />
                  </div>
                  <h3 className="text-xl font-black tracking-[0]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{item.content}</p>
                  {item.link && (
                    <a className="mt-3 inline-block text-sm font-extrabold text-teal-700 underline underline-offset-2" href={item.link} target="_blank" rel="noreferrer">
                      {item.link}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
