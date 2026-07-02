import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <section className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-8 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-teal-700 shadow-sm">
            <span className="size-2 rounded-full bg-emerald-600" aria-hidden="true" />
            대명캠과 성서캠을 연결하는 협업 프로필
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-[0] text-slate-950 sm:text-5xl lg:text-6xl">
            서로 필요한 사람을 작업물로 확인하고 바로 팀을 만든다
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            캠퍼스가 달라 만나기 어려운 개발자, 기획자, 아티스트가 검증된 포트폴리오와 팀 상황을 기준으로 연결되는 학생 협업 플랫폼입니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-5 text-sm font-extrabold text-white transition hover:bg-slate-800"
              href="/onboarding"
            >
              프로필 만들기
            </Link>
            <Link
              className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-950 transition hover:border-slate-400"
              href="/projects"
            >
              추천 프로젝트 보기
            </Link>
          </div>

          <div className="mt-7 grid max-w-2xl grid-cols-3 gap-3">
            {[
              ["2", "캠퍼스 기반 매칭"],
              ["8", "역할 태그"],
              ["5", "온보딩 단계"],
            ].map(([value, label]) => (
              <div className="rounded-lg border border-slate-200 bg-white/80 p-4" key={label}>
                <strong className="block text-2xl font-black">{value}</strong>
                <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-2" aria-label="포트폴리오 미리보기">
            {[
              ["캐릭터 애니메이션 샘플", "대명캠 · 2D 애니메이션", "from-teal-50 via-blue-50 to-slate-100"],
              ["Unity 전투 프로토타입", "성서캠 · 클라이언트 개발", "from-amber-50 via-rose-50 to-blue-50"],
            ].map(([title, meta, color]) => (
              <article className="overflow-hidden rounded-lg border border-slate-200 bg-white" key={title}>
                <div className={`relative h-32 bg-gradient-to-br ${color}`}>
                  <span className="absolute bottom-5 left-5 h-16 w-12 rounded-t-full rounded-b-lg bg-slate-950 shadow-[64px_-14px_0_-16px_#0f766e,112px_10px_0_-24px_#b45309]" />
                  <span className="absolute right-5 top-5 h-16 w-24 rounded-lg border border-white/80 bg-white/55" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-black">{title}</h3>
                  <p className="mt-1 text-xs font-bold text-slate-500">{meta}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="self-start rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(23,32,42,0.08)] lg:sticky lg:top-24" aria-label="이용 순서">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-teal-700">How it works</p>
          <h2 className="mt-2 text-2xl font-black tracking-[0]">한 화면이 아니라, 단계별로 진행돼요</h2>
          <ol className="mt-5 grid gap-4">
            {[
              ["1", "온보딩", "캠퍼스·역할·포트폴리오를 5단계로 등록합니다.", "/onboarding"],
              ["2", "프로젝트", "추천 프로젝트를 보고 등록하거나 지원합니다.", "/projects"],
              ["3", "포트폴리오", "작업물을 블로그 쓰듯 정리해 올립니다.", "/projects"],
              ["4", "지원 현황", "지원·제안 상태를 한곳에서 확인합니다.", "/applications"],
            ].map(([step, title, desc, href]) => (
              <li key={step}>
                <Link
                  href={href}
                  className="flex items-start gap-4 rounded-lg border border-slate-200 p-4 transition hover:border-teal-700 hover:bg-teal-50/40"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">
                    {step}
                  </span>
                  <span>
                    <span className="block text-sm font-black text-slate-950">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">{desc}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  );
}
