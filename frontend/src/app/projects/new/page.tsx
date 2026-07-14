"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileDropField, IMAGE_FILE_ACCEPT } from "@/shared/components/file-drop-field";
import { useProjectMutations } from "@/features/projects/hooks/use-project-mutations";
import { roles as roleOptions } from "@/shared/constants";
import type { Campus, Project } from "@/shared/types";

const statusOptions: Project["status"][] = ["모집중", "진행중", "완료"];

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject, projectSaveState } = useProjectMutations();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [campus, setCampus] = useState<Campus>("대명캠");
  const [role, setRole] = useState(roleOptions[0]);
  const [status, setStatus] = useState<Project["status"]>(statusOptions[0]);
  const [tagsInput, setTagsInput] = useState("");
  const [coverFileName, setCoverFileName] = useState<string | undefined>(undefined);

  const missingFields = [
    title.trim().length === 0 && "제목",
    summary.trim().length === 0 && "한 줄 소개",
    content.trim().length === 0 && "본문",
  ].filter((value): value is string => Boolean(value));

  const isValid = missingFields.length === 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    try {
      await createProject({
        title: title.trim(),
        campus,
        role,
        status,
        summary: summary.trim(),
        content: content.trim(),
        tagLabels: tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        coverImageName: coverFileName,
      });

      router.push("/projects?created=project");
    } catch {
      // Error state is displayed from projectSaveState.
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-16 text-slate-950">
      <section className="mx-auto w-[min(880px,calc(100%-32px))] py-10 lg:py-14">
        <Link href="/projects" className="text-sm font-extrabold text-slate-500 hover:text-slate-950">
          ← 프로젝트 목록으로
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-[0] sm:text-4xl">프로젝트 등록</h1>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          프로젝트 소개와 모집 정보를 입력해주세요.
        </p>

        <form className="mt-8 grid gap-8" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            <span>
              프로젝트 제목 <span className="text-rose-600">*</span>
            </span>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-2xl font-black tracking-[0] text-slate-950 outline-none placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100 sm:text-3xl"
              placeholder="프로젝트 제목을 입력하세요"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <FileDropField
            label="대표 이미지 (선택)"
            helperText="프로젝트를 대표하는 이미지나 콘셉트 아트를 올려주세요. 올리지 않아도 등록할 수 있어요."
            accept={IMAGE_FILE_ACCEPT}
            onFileSelect={(file) => setCoverFileName(file?.name)}
          />

          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            <span>
              한 줄 소개 <span className="text-rose-600">*</span>
            </span>
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              placeholder="목록에서 바로 보이는 짧은 요약을 적어주세요"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            <span>
              본문 <span className="text-rose-600">*</span>
            </span>
            <textarea
              className="min-h-64 rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium leading-7 outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              placeholder={"어떤 프로젝트인지, 어디까지 진행됐는지, 어떤 팀원이 필요한지 자유롭게 작성해보세요.\n\n예)\n- 지금까지 진행한 내용\n- 함께할 팀원에게 기대하는 점\n- 협업 방식과 일정"}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </label>

          <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.08em] text-slate-500">모집 정보</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                캠퍼스
                <select
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none"
                  value={campus}
                  onChange={(event) => setCampus(event.target.value as Campus)}
                >
                  <option>대명캠</option>
                  <option>성서캠</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                필요 역할
                <select
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  {roleOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                진행 상태
                <select
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as Project["status"])}
                >
                  {statusOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-extrabold text-slate-700">
              태그 (쉼표로 구분)
              <input
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none"
                placeholder="Unity, 졸업작품, 2D 애니메이션"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
              />
            </label>
          </div>

          {projectSaveState.error && (
            <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{projectSaveState.error}</p>
          )}

          <div className="flex flex-col items-end gap-2">
            {!isValid && (
              <p className="text-sm font-bold text-rose-600">{missingFields.join(", ")} 입력이 필요해요.</p>
            )}
            <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:justify-end">
              <Link
                href="/projects"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-950 transition hover:border-slate-400"
              >
                취소
              </Link>
              <button
                className="min-h-11 rounded-lg bg-teal-700 px-6 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45"
                type="submit"
                disabled={!isValid || projectSaveState.isSaving}
              >
                {projectSaveState.isSaving ? "등록 중…" : "등록하기"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
