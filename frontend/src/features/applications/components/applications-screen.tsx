"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/shared/components/tag";
import type { Application } from "@/shared/types";

type Direction = "sent" | "received";

type ApplicationsScreenProps = {
  initialApplications: Application[];
  authenticated: boolean;
};

export function ApplicationsScreen({ initialApplications, authenticated }: ApplicationsScreenProps) {
  const applications = initialApplications;
  const [direction, setDirection] = useState<Direction>("sent");

  const sent = useMemo(() => applications.filter((item) => item.direction === "sent"), [applications]);
  const received = useMemo(() => applications.filter((item) => item.direction === "received"), [applications]);

  const visible = direction === "sent" ? sent : received;

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] pb-16 text-slate-950">
        <section className="mx-auto w-[min(760px,calc(100%-32px))] py-10 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">Applications</p>
          <h1 className="mt-2 text-3xl font-black tracking-[0] sm:text-4xl">내 지원 현황</h1>
          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
            지원 현황을 보려면 먼저 로그인해주세요.
          </div>
          <Link href="/onboarding" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-teal-700 px-4 text-sm font-extrabold text-white">
            로그인 / 온보딩으로 이동
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-16 text-slate-950">
      <section className="mx-auto w-[min(760px,calc(100%-32px))] py-10 lg:py-14">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">Applications</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-black tracking-[0] sm:text-4xl">내 지원 현황</h1>
          <span className="text-sm font-extrabold text-slate-500">{applications.length}건</span>
        </div>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          프로젝트에 지원하거나 인재에게 제안하면 &quot;내가 보낸 지원&quot;에 모이고, 다른 학생이 내 프로젝트에 지원하거나
          제안을 보내면 &quot;내가 받은 제안&quot;에서 확인할 수 있어요.
        </p>

        <div className="mt-6 inline-flex rounded-lg border border-slate-200 bg-white p-1" role="tablist" aria-label="지원 현황 탭">
          <button
            className={`min-h-10 rounded-lg px-4 text-sm font-extrabold transition ${
              direction === "sent" ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
            }`}
            type="button"
            role="tab"
            aria-selected={direction === "sent"}
            onClick={() => setDirection("sent")}
          >
            내가 보낸 지원 ({sent.length})
          </button>
          <button
            className={`min-h-10 rounded-lg px-4 text-sm font-extrabold transition ${
              direction === "received" ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
            }`}
            type="button"
            role="tab"
            aria-selected={direction === "received"}
            onClick={() => setDirection("received")}
          >
            내가 받은 제안 ({received.length})
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {visible.map((application) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5" key={application.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-500">{application.type}</p>
                  <h3 className="mt-1 text-lg font-black">{application.title}</h3>
                </div>
                <StatusBadge status={application.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{application.meta}</p>
              {application.projectId && (
                <Link
                  href={`/projects/${application.projectId}`}
                  className="mt-3 inline-block text-xs font-extrabold text-teal-700 underline underline-offset-2"
                >
                  프로젝트 보기
                </Link>
              )}
            </article>
          ))}

          {visible.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-bold text-slate-500">
                {direction === "sent" ? "아직 지원하거나 제안한 내역이 없습니다." : "아직 받은 제안이 없습니다."}
              </p>
              <Link href="/projects" className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-teal-700 px-4 text-sm font-extrabold text-white">
                프로젝트 보러 가기
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
