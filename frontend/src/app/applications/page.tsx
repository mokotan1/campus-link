"use client";

import Link from "next/link";
import { StatusBadge } from "@/shared/components/tag";
import { useAppData } from "@/shared/lib/app-data-context";

export default function ApplicationsPage() {
  const { applications } = useAppData();

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-16 text-slate-950">
      <section className="mx-auto w-[min(760px,calc(100%-32px))] py-10 lg:py-14">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">Applications</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-black tracking-[0] sm:text-4xl">내 지원 현황</h1>
          <span className="text-sm font-extrabold text-slate-500">{applications.length}건</span>
        </div>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          프로젝트 페이지에서 지원하거나 제안하면 여기에 모여요.
        </p>

        <div className="mt-8 grid gap-3">
          {applications.map((application) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5" key={application.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-500">{application.type}</p>
                  <h3 className="mt-1 text-lg font-black">{application.title}</h3>
                </div>
                <StatusBadge status={application.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{application.meta}</p>
            </article>
          ))}

          {applications.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-bold text-slate-500">아직 지원하거나 제안한 내역이 없습니다.</p>
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
