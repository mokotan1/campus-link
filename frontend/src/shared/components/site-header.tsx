"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/onboarding", label: "온보딩" },
  { href: "/projects", label: "프로젝트" },
  { href: "/applications", label: "지원 현황" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex min-h-18 w-[min(1180px,calc(100%-32px))] flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link className="flex items-center gap-3 font-extrabold" href="/" aria-label="Campus Link 홈">
          <span className="relative size-10 shrink-0 overflow-hidden" aria-hidden="true">
            <Image
              src="/brand/campus-link-logo.png"
              alt=""
              width={390}
              height={559}
              className="absolute -left-[21px] -top-[19px] h-[119px] w-[83px] max-w-none"
            />
          </span>
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
        </nav>
      </div>
    </header>
  );
}
