"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppData } from "@/shared/lib/app-data-context";

const navItems = [
  { href: "/onboarding", label: "온보딩" },
  { href: "/projects", label: "프로젝트" },
  { href: "/applications", label: "지원 현황" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { isInitializing, isAuthenticated } = useAppData();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex min-h-18 w-[min(1180px,calc(100%-32px))] flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link className="flex items-center gap-3 font-extrabold" href="/" aria-label="Campus Link 홈">
          <span className="grid size-10 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">CL</span>
          <span className="text-xl">Campus Link</span>
        </Link>
        <nav className="flex gap-2 overflow-x-auto pb-1 text-sm font-bold text-slate-600" aria-label="주요 메뉴">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 transition ${
                  active ? "bg-slate-950 text-white" : "hover:bg-slate-100 hover:text-slate-950"
                }`}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          {isInitializing ? (
            <span className="whitespace-nowrap rounded-lg px-3 py-2 text-slate-400">확인 중...</span>
          ) : isAuthenticated ? (
            <Link
              className="whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 transition hover:bg-emerald-100"
              href="/applications"
            >
              로그인됨
            </Link>
          ) : (
            <Link
              className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              href="/auth"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
