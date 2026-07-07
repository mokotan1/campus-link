import Link from "next/link";

import { AuthPanel } from "@/features/auth/components/auth-panel";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-300">Campus Link Auth</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              회원가입 / 로그인 초안
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
              Supabase Auth 기준으로 가장 먼저 확인할 이메일 회원가입과 로그인을
              테스트하는 화면입니다.
            </p>
          </div>

          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-800 px-4 text-sm text-zinc-200"
            href="/"
          >
            초기 설정판으로 돌아가기
          </Link>
        </div>

        <AuthPanel />
      </div>
    </main>
  );
}
