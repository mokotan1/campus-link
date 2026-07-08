"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileDropField } from "@/shared/components/file-drop-field";
import { useAppData } from "@/shared/lib/app-data-context";

const roleOptions = ["개발", "기획", "2D 아트", "3D 모델링", "애니메이션", "UI/UX"];

export default function NewPortfolioPage() {
  const router = useRouter();
  const { addPortfolio } = useAppData();

  const [title, setTitle] = useState("");
  const [role, setRole] = useState(roleOptions[0]);
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [coverFileName, setCoverFileName] = useState<string | undefined>(undefined);

  const isValid =
    title.trim().length > 0 &&
    summary.trim().length > 0 &&
    content.trim().length > 0 &&
    link.trim().length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    try {
      await addPortfolio({
        title: title.trim(),
        role,
        summary: summary.trim(),
        content: content.trim(),
        link: link.trim() || undefined,
        coverImageName: coverFileName,
      });

      router.push("/projects");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "포트폴리오 등록에 실패했습니다.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-16 text-slate-950">
      <section className="mx-auto w-[min(880px,calc(100%-32px))] py-10 lg:py-14">
        <Link href="/projects" className="text-sm font-extrabold text-slate-500 hover:text-slate-950">
          ← 프로젝트 · 포트폴리오로
        </Link>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-teal-700">New Portfolio</p>
        <h1 className="mt-2 text-3xl font-black tracking-[0] sm:text-4xl">포트폴리오 작성</h1>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          작업물을 블로그 글처럼 정리해보세요. 제목, 대표 이미지, 소개, 본문 순서로 작성하면 됩니다.
        </p>

        <form className="mt-8 grid gap-8" onSubmit={handleSubmit}>
          <input
            className="w-full border-none bg-transparent text-3xl font-black tracking-[0] text-slate-950 outline-none placeholder:text-slate-300 sm:text-4xl"
            placeholder="작업물 제목을 입력하세요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <FileDropField
            label="대표 이미지"
            helperText="완성 컷, 스크린샷, 시연 GIF 등 대표 이미지를 올려주세요"
            accept="image/*,video/*"
            onFileSelect={(file) => setCoverFileName(file?.name)}
          />

          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            한 줄 소개
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              placeholder="목록에서 바로 보이는 짧은 요약을 적어주세요"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            본문
            <textarea
              className="min-h-64 rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium leading-7 outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              placeholder={"작업 배경, 맡은 역할, 어려웠던 점과 해결 과정을 자유롭게 작성해보세요."}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </label>

          <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.08em] text-slate-500">작업물 정보</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                작업물 내 역할
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
                외부 링크
                <input
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none"
                  placeholder="ArtStation, GitHub, YouTube"
                  type="url"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-950 transition hover:border-slate-400"
            >
              취소
            </Link>
            <button
              className="min-h-11 rounded-lg bg-teal-700 px-6 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45"
              type="submit"
              disabled={!isValid}
            >
              게시하기
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
