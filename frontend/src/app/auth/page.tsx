import Link from "next/link";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-16 text-slate-950">
      <section className="mx-auto w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-teal-700">Auth</p>
        <h1 className="mt-3 text-3xl font-black tracking-[0]">로그인 준비 페이지</h1>
        <p className="mt-3 leading-7 text-slate-600">
          현재 이 브랜치에서는 실제 디자인 화면을 유지하면서 API 연결 작업을 먼저 붙이고 있습니다.
          로그인 UI는 이후 프론트 화면과 맞춰 연결하면 됩니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/onboarding"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-extrabold text-white"
          >
            온보딩으로 이동
          </Link>
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-950"
          >
            프로젝트 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
