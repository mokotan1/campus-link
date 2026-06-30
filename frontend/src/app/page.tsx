"use client";

import { useMemo, useState } from "react";

type TagTone = "default" | "teal" | "blue" | "amber" | "rose" | "green";

type Project = {
  id: number;
  title: string;
  campus: "대명캠" | "성서캠";
  role: string;
  status: "모집중" | "진행중" | "완료";
  description: string;
  tags: { label: string; tone?: TagTone }[];
  verified: string;
  action: "지원하기" | "제안하기";
  accent: "blue" | "amber" | "green";
};

type Talent = {
  id: number;
  name: string;
  campus: "대명캠" | "성서캠";
  role: string;
  tools: { label: string; tone?: TagTone }[];
  availability: string;
  portfolio: string;
};

type Application = {
  id: number;
  title: string;
  type: "지원" | "제안";
  status: "대기" | "수락" | "거절" | "취소";
  meta: string;
};

const roles = ["개발", "기획", "2D 아트", "3D 모델링", "애니메이션", "UI/UX"];
const collaborationTypes = ["졸업작품", "게임잼", "공모전", "포트폴리오 단기 프로젝트"];
const availabilityOptions = ["3시간 이하", "4-7시간", "8-12시간", "13시간 이상"];
const campuses = ["전체 캠퍼스", "대명캠", "성서캠"];
const roleFilters = ["모든 역할", "개발", "기획", "2D 아트", "애니메이션", "UI/UX"];
const statusFilters = ["전체 상태", "모집중", "진행중", "완료"];

const initialProjects: Project[] = [
  {
    id: 1,
    title: "리듬 액션 졸업작품 팀",
    campus: "성서캠",
    role: "2D 아트",
    status: "모집중",
    description: "Unity 프로토타입은 완성했고 캐릭터 애니메이션과 UI 아트를 함께 다듬을 팀원을 찾습니다.",
    tags: [
      { label: "Unity", tone: "blue" },
      { label: "2D 애니메이션", tone: "rose" },
      { label: "졸업작품", tone: "amber" },
    ],
    verified: "기획서 · 프로토타입 확인됨",
    action: "지원하기",
    accent: "blue",
  },
  {
    id: 2,
    title: "스토리 퍼즐 어드벤처",
    campus: "대명캠",
    role: "개발",
    status: "모집중",
    description: "콘셉트 아트와 시나리오 초안이 준비된 팀에서 플레이어블 데모를 구현할 개발 파트너를 찾습니다.",
    tags: [
      { label: "프론트 개발", tone: "blue" },
      { label: "게임잼", tone: "amber" },
      { label: "Figma" },
    ],
    verified: "아트보드 · 시나리오 확인됨",
    action: "제안하기",
    accent: "amber",
  },
  {
    id: 3,
    title: "협동 로그라이크 프로토타입",
    campus: "성서캠",
    role: "애니메이션",
    status: "진행중",
    description: "개발팀 3명이 전투 루프를 제작 중이며 몬스터 디자인과 이펙트 작업자를 모집합니다.",
    tags: [
      { label: "Godot", tone: "blue" },
      { label: "캐릭터 디자인", tone: "rose" },
      { label: "VFX" },
    ],
    verified: "팀 구성 · 일정 확인됨",
    action: "지원하기",
    accent: "green",
  },
];

const talents: Talent[] = [
  {
    id: 1,
    name: "이서윤",
    campus: "대명캠",
    role: "2D 애니메이션",
    tools: [
      { label: "Clip Studio", tone: "rose" },
      { label: "Spine" },
      { label: "바로 가능", tone: "teal" },
    ],
    availability: "졸업작품 · 주 8-12시간",
    portfolio: "캐릭터 러프부터 완성 컷까지 이어지는 애니메이션 샘플 보유",
  },
  {
    id: 2,
    name: "박도현",
    campus: "성서캠",
    role: "Unity 개발",
    tools: [
      { label: "Unity", tone: "blue" },
      { label: "GitHub" },
      { label: "공모전 선호", tone: "amber" },
    ],
    availability: "게임잼 · 주 4-7시간",
    portfolio: "플레이 영상과 GitHub 저장소로 구현 범위 확인 가능",
  },
  {
    id: 3,
    name: "정민아",
    campus: "대명캠",
    role: "UI/UX",
    tools: [
      { label: "Figma", tone: "blue" },
      { label: "Photoshop" },
      { label: "일정 맞으면 가능", tone: "green" },
    ],
    availability: "포트폴리오 단기 프로젝트",
    portfolio: "메뉴 플로우, HUD, 온보딩 화면 설계 경험",
  },
];

const initialApplications: Application[] = [
  {
    id: 1,
    title: "리듬 액션 졸업작품 팀",
    type: "지원",
    status: "대기",
    meta: "2D 아트 역할로 지원 완료",
  },
  {
    id: 2,
    title: "이서윤",
    type: "제안",
    status: "수락",
    meta: "캐릭터 애니메이션 협업 제안",
  },
];

const tagToneClass: Record<TagTone, string> = {
  default: "bg-slate-100 text-slate-700 ring-slate-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const projectMediaClass: Record<Project["accent"], string> = {
  blue: "from-blue-100 via-slate-100 to-teal-100",
  amber: "from-amber-100 via-stone-100 to-rose-100",
  green: "from-teal-100 via-emerald-50 to-lime-100",
};

function Tag({ label, tone = "default" }: { label: string; tone?: TagTone }) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold ring-1 ${tagToneClass[tone]}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: Application["status"] | Project["status"] }) {
  const tone: TagTone =
    status === "수락" || status === "모집중"
      ? "teal"
      : status === "대기" || status === "진행중"
        ? "amber"
        : status === "거절"
          ? "rose"
          : "default";

  return <Tag label={status} tone={tone} />;
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [selectedRoles, setSelectedRoles] = useState(["개발", "2D 아트"]);
  const [query, setQuery] = useState("");
  const [campusFilter, setCampusFilter] = useState("전체 캠퍼스");
  const [roleFilter, setRoleFilter] = useState("모든 역할");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [projects, setProjects] = useState(initialProjects);
  const [applications, setApplications] = useState(initialApplications);
  const [showProjectForm, setShowProjectForm] = useState(false);

  const currentStepTitle = ["기본 정보", "역할 선택", "작업물 검증", "협업 상태", "맞춤 추천"][step];
  const currentStepDescription = [
    "캠퍼스와 학과를 먼저 확인합니다.",
    "프로젝트에서 맡을 수 있는 역할을 표시합니다.",
    "포트폴리오와 본인 역할을 함께 등록합니다.",
    "지금 어떤 방식으로 팀에 참여할 수 있는지 정합니다.",
    "입력한 정보로 어울리는 팀을 먼저 보여줍니다.",
  ][step];

  const filteredProjects = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return projects.filter((project) => {
      const searchable = [project.title, project.description, project.role, project.campus, project.status, ...project.tags.map((tag) => tag.label)]
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || searchable.includes(keyword)) &&
        (campusFilter === "전체 캠퍼스" || project.campus === campusFilter) &&
        (roleFilter === "모든 역할" || project.role === roleFilter || project.tags.some((tag) => tag.label.includes(roleFilter))) &&
        (statusFilter === "전체 상태" || project.status === statusFilter)
      );
    });
  }, [campusFilter, projects, query, roleFilter, statusFilter]);

  function toggleRole(role: string) {
    setSelectedRoles((current) => (current.includes(role) ? current.filter((item) => item !== role) : [...current, role]));
  }

  function goToDashboard() {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function addApplication(title: string, type: Application["type"], meta: string) {
    setApplications((current) => {
      if (current.some((item) => item.title === title && item.type === type)) {
        return current;
      }

      return [
        {
          id: Date.now(),
          title,
          type,
          status: "대기",
          meta,
        },
        ...current,
      ];
    });

    document.getElementById("applications")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function addDemoProject() {
    const nextId = Math.max(...projects.map((project) => project.id)) + 1;

    setProjects((current) => [
      {
        id: nextId,
        title: "신규 캠퍼스 협업 프로젝트",
        campus: "대명캠",
        role: "개발",
        status: "모집중",
        description: "포트폴리오 검증을 마친 팀원과 빠르게 MVP를 만드는 단기 프로젝트입니다.",
        tags: [
          { label: "Next.js", tone: "blue" },
          { label: "포트폴리오", tone: "amber" },
          { label: "UI/UX" },
        ],
        verified: "초안 · 일정 확인됨",
        action: "제안하기",
        accent: "blue",
      },
      ...current,
    ]);

    setShowProjectForm(false);
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 backdrop-blur">
        <div className="mx-auto flex min-h-18 w-[min(1180px,calc(100%-32px))] flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <a className="flex items-center gap-3 font-extrabold" href="#onboarding" aria-label="Campus Link 홈">
            <span className="grid size-10 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">CL</span>
            <span className="text-xl">Campus Link</span>
          </a>
          <nav className="flex gap-2 overflow-x-auto pb-1 text-sm font-bold text-slate-600" aria-label="주요 메뉴">
            <a className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-950" href="#onboarding">
              온보딩
            </a>
            <a className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-950" href="#projects">
              프로젝트
            </a>
            <a className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-950" href="#portfolio">
              포트폴리오
            </a>
            <a className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-950" href="#applications">
              지원 현황
            </a>
          </nav>
        </div>
      </header>

      <section id="onboarding" className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-8 py-10 lg:grid-cols-[1.04fr_0.96fr] lg:py-14">
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
            <button
              className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-extrabold text-white transition hover:bg-slate-800"
              type="button"
              onClick={() => setStep(0)}
            >
              프로필 만들기
            </button>
            <button
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-950 transition hover:border-slate-400"
              type="button"
              onClick={goToDashboard}
            >
              추천 프로젝트 보기
            </button>
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

        <aside className="self-start rounded-lg border border-slate-200 bg-white shadow-[0_18px_50px_rgba(23,32,42,0.08)] lg:sticky lg:top-24" aria-label="온보딩 양식">
          <div className="flex items-start justify-between gap-5 border-b border-slate-200 p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-teal-700">Onboarding</p>
              <h2 className="mt-2 text-2xl font-black tracking-[0]">{currentStepTitle}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{currentStepDescription}</p>
            </div>
            <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-teal-50 text-sm font-black text-teal-700">{step + 1}/5</div>
          </div>
          <div className="h-2 bg-slate-100" aria-hidden="true">
            <div className="h-full bg-teal-700 transition-all" style={{ width: `${((step + 1) / 5) * 100}%` }} />
          </div>

          <form className="p-5">
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  이름 또는 닉네임
                  <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100" placeholder="예: 김하린" />
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  캠퍼스
                  <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100">
                    <option>대명캠</option>
                    <option>성서캠</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  학과
                  <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100" placeholder="예: 영상애니메이션과" />
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  학년
                  <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100">
                    <option>1학년</option>
                    <option>2학년</option>
                    <option>3학년</option>
                    <option>4학년</option>
                    <option>졸업 예정</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700 sm:col-span-2">
                  학교 이메일
                  <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100" placeholder="student@school.ac.kr" type="email" />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((role) => {
                    const active = selectedRoles.includes(role);

                    return (
                      <button
                        className={`min-h-14 rounded-lg border px-4 text-left text-sm font-extrabold transition ${
                          active ? "border-teal-700 bg-teal-50 text-teal-800" : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-white"
                        }`}
                        key={role}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleRole(role)}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  사용 가능 툴
                  <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100" placeholder="Unity, Blender, Photoshop, Figma" />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4">
                <label className="grid min-h-32 cursor-pointer place-items-center rounded-lg border border-dashed border-slate-400 bg-slate-50 p-5 text-center text-sm font-bold leading-6 text-slate-500 transition hover:border-teal-700 hover:bg-white">
                  <input className="sr-only" type="file" accept="image/*,video/*" />
                  대표 이미지, 영상 썸네일, 시연 GIF를 올리는 영역
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                    외부 링크
                    <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100" placeholder="ArtStation, GitHub, YouTube" type="url" />
                  </label>
                  <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                    작업물 내 역할
                    <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100" placeholder="예: 캐릭터 원화, Unity 구현" />
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {["바로 가능", "일정 맞으면 가능", "구경만", "팀 보유 중"].map((status, index) => (
                    <label className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm font-extrabold text-slate-700" key={status}>
                      <input className="size-4 accent-teal-700" name="status" type="radio" defaultChecked={index === 0} />
                      {status}
                    </label>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                    원하는 협업
                    <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100">
                      {collaborationTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                    주당 가능 시간
                    <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100">
                      {availabilityOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4">
                <div className="border-l-4 border-teal-700 bg-teal-50 px-4 py-4">
                  <h3 className="font-black text-teal-950">추천 결과 준비 완료</h3>
                  <p className="mt-2 text-sm leading-6 text-teal-900">
                    역할, 프로젝트 상태, 작업물 검증 기준으로 대명캠 아트 인력과 성서캠 개발팀을 연결합니다.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Tag label="2D 아트 필요" tone="teal" />
                  <Tag label="Unity 팀" tone="blue" />
                  <Tag label="졸업작품" tone="amber" />
                  <Tag label="영상 포트폴리오" tone="rose" />
                </div>
              </div>
            )}
          </form>

          <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-between">
            <button
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              이전
            </button>
            <button
              className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-extrabold text-white transition hover:bg-teal-800"
              type="button"
              onClick={() => {
                if (step === 4) {
                  goToDashboard();
                  return;
                }
                setStep((current) => Math.min(4, current + 1));
              }}
            >
              {step === 4 ? "대시보드 보기" : "다음"}
            </button>
          </div>
        </aside>
      </section>

      <section id="projects" className="mx-auto w-[min(1180px,calc(100%-32px))] scroll-mt-24 py-12" aria-label="추천 프로젝트 대시보드">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">Dashboard</p>
            <h2 className="mt-2 text-3xl font-black tracking-[0] sm:text-4xl">추천 프로젝트</h2>
            <p className="mt-2 max-w-2xl leading-7 text-slate-600">프로필과 포트폴리오 기준으로 협업 가능성이 높은 팀을 먼저 보여줍니다.</p>
          </div>
          <button
            className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-extrabold text-white transition hover:bg-slate-800"
            type="button"
            onClick={() => setShowProjectForm((current) => !current)}
          >
            프로젝트 등록
          </button>
        </div>

        {showProjectForm && (
          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <input className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none md:col-span-2" defaultValue="신규 캠퍼스 협업 프로젝트" aria-label="프로젝트 제목" />
              <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none" aria-label="모집 캠퍼스">
                <option>대명캠</option>
                <option>성서캠</option>
              </select>
              <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none" aria-label="필요 역할">
                <option>개발</option>
                <option>2D 아트</option>
                <option>애니메이션</option>
                <option>UI/UX</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-extrabold text-white" type="button" onClick={addDemoProject}>
                등록하기
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-[1.4fr_repeat(3,minmax(140px,1fr))]">
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            placeholder="프로젝트명, 역할, 툴 검색"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none" value={campusFilter} onChange={(event) => setCampusFilter(event.target.value)}>
            {campuses.map((campus) => (
              <option key={campus}>{campus}</option>
            ))}
          </select>
          <select className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            {roleFilters.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
          <select className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusFilters.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-xl font-black">팀원 모집</h3>
              <span className="text-sm font-extrabold text-slate-500">{filteredProjects.length}개 프로젝트</span>
            </div>
            <div className="grid gap-4">
              {filteredProjects.map((project) => (
                <article className="overflow-hidden rounded-lg border border-slate-200 bg-white md:grid md:min-h-48 md:grid-cols-[190px_1fr]" key={project.id}>
                  <div className={`relative min-h-40 bg-gradient-to-br ${projectMediaClass[project.accent]}`} aria-hidden="true">
                    <span className="absolute bottom-7 left-7 h-20 w-14 rounded-t-full rounded-b-lg bg-slate-950 shadow-[66px_12px_0_-22px_#0f766e,112px_-16px_0_-28px_#be123c]" />
                    <span className="absolute right-5 top-5 h-16 w-20 rounded-lg border border-white/80 bg-white/50" />
                  </div>
                  <div className="grid gap-4 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <Tag label={project.campus} tone="green" />
                          <StatusBadge status={project.status} />
                        </div>
                        <h4 className="text-xl font-black tracking-[0]">{project.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{project.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Tag key={tag.label} label={tag.label} tone={tag.tone} />
                      ))}
                    </div>
                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-black text-emerald-700">{project.verified}</span>
                      <button
                        className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-extrabold text-slate-950 transition hover:border-teal-700 hover:text-teal-800"
                        type="button"
                        onClick={() => addApplication(project.title, project.action === "지원하기" ? "지원" : "제안", `${project.role} 역할 · ${project.campus}`)}
                      >
                        {project.action}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="grid content-start gap-5">
            <section id="portfolio" className="scroll-mt-24">
              <div className="mb-3 flex items-center justify-between gap-4">
                <h3 className="text-xl font-black">추천 인재</h3>
                <span className="text-sm font-extrabold text-slate-500">검증 프로필</span>
              </div>
              <div className="grid gap-4">
                {talents.map((talent) => (
                  <article className="rounded-lg border border-slate-200 bg-white p-5" key={talent.id}>
                    <div className="grid grid-cols-[58px_1fr] gap-3">
                      <div className="relative size-14 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-rose-100" aria-hidden="true">
                        <span className="absolute left-5 top-3 size-5 rounded-full bg-slate-950 shadow-[0_22px_0_9px_#0f172a]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black">{talent.name}</h4>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {talent.campus} · {talent.role}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{talent.portfolio}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {talent.tools.map((tag) => (
                        <Tag key={tag.label} label={tag.label} tone={tag.tone} />
                      ))}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
                      <span className="text-sm font-bold text-slate-500">{talent.availability}</span>
                      <button
                        className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-extrabold text-white transition hover:bg-slate-800"
                        type="button"
                        onClick={() => addApplication(talent.name, "제안", `${talent.role} · ${talent.availability}`)}
                      >
                        제안하기
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="applications" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-xl font-black">내 지원 현황</h3>
                <span className="text-sm font-extrabold text-slate-500">{applications.length}건</span>
              </div>
              <div className="grid gap-3">
                {applications.map((application) => (
                  <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={application.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-500">{application.type}</p>
                        <h4 className="mt-1 font-black">{application.title}</h4>
                      </div>
                      <StatusBadge status={application.status} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{application.meta}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
