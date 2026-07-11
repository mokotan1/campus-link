"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Tag, StatusBadge } from "@/shared/components/tag";
import { projectMediaClass } from "@/shared/constants";
import { useAppData } from "@/shared/lib/app-data-context";

function formatDeadline(deadline: string) {
  if (!deadline) return "마감일 미정";
  return deadline.replaceAll("-", ".");
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isInitializing, isAuthenticated, projects, createApplication, hasApplied, applicationSaveState } =
    useAppData();
  const [justApplied, setJustApplied] = useState(false);

  const project = projects.find((item) => item.id === id);

  if (isInitializing) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] pb-16 text-slate-950">
        <section className="mx-auto w-[min(760px,calc(100%-32px))] py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">Loading</p>
          <h1 className="mt-3 text-3xl font-black tracking-[0]">프로젝트 정보를 불러오고 있습니다</h1>
          <p className="mt-3 leading-7 text-slate-600">잠시만 기다리면 상세 내용이 표시됩니다.</p>
        </section>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] pb-16 text-slate-950">
        <section className="mx-auto w-[min(760px,calc(100%-32px))] py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">Project Not Found</p>
          <h1 className="mt-3 text-3xl font-black tracking-[0]">존재하지 않는 프로젝트입니다</h1>
          <p className="mt-3 leading-7 text-slate-600">
            삭제되었거나 잘못된 주소일 수 있어요. 목록으로 돌아가서 다시 찾아보세요.
          </p>
          <Link
            href="/projects"
            className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-5 text-sm font-extrabold text-white transition hover:bg-slate-800"
          >
            프로젝트 목록으로
          </Link>
        </section>
      </main>
    );
  }

  const applied = hasApplied({ projectId: project.id, type: "지원" });

  async function handleApply() {
    try {
      await createApplication({
        title: project!.title,
        type: "지원",
        meta: `${project!.role} 역할 · ${project!.campus}`,
        projectId: project!.id,
      });
      setJustApplied(true);
    } catch {
      // Error state is displayed from applicationSaveState.
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-16 text-slate-950">
      <section className="mx-auto w-[min(880px,calc(100%-32px))] py-10 lg:py-14">
        <Link href="/projects" className="text-sm font-extrabold text-slate-500 hover:text-slate-950">
          ← 프로젝트 목록으로
        </Link>

        <div className={`mt-6 h-40 rounded-lg bg-gradient-to-br ${projectMediaClass[project.accent]}`} aria-hidden="true" />

        <div className="mt-6 flex flex-wrap gap-2">
          <Tag label={project.campus} tone="green" />
          <StatusBadge status={project.status} />
          <Tag label={project.category} tone="blue" />
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-[0] sm:text-4xl">{project.title}</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">
          작성자 {project.author} · 모집 역할 {project.recruitingRoles.join(", ")} · 인원 {project.currentMembers}/
          {project.maxMembers}명 · 마감 {formatDeadline(project.deadline)}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Tag key={tag.label} label={tag.label} tone={tag.tone} />
          ))}
        </div>

        <p className="mt-6 whitespace-pre-line rounded-lg border border-slate-200 bg-white p-6 text-sm leading-8 text-slate-700">
          {project.content}
        </p>

        {applicationSaveState.error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{applicationSaveState.error}</p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6">
          {isAuthenticated ? (
            <button
              className="min-h-11 rounded-lg bg-teal-700 px-6 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={applied || applicationSaveState.isSaving}
              onClick={handleApply}
            >
              {applied ? "지원 완료" : project.action}
            </button>
          ) : (
            <Link
              href="/auth"
              className="inline-flex min-h-11 items-center rounded-lg bg-teal-700 px-6 text-sm font-extrabold text-white transition hover:bg-teal-800"
            >
              로그인 후 지원
            </Link>
          )}
          {(applied || justApplied) && (
            <Link href="/applications" className="text-sm font-extrabold text-teal-700 underline underline-offset-2">
              지원 현황에서 확인하기
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
