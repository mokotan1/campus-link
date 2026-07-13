"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "@/shared/components/tag";
import { FileDropField, IMAGE_AND_VIDEO_FILE_ACCEPT } from "@/shared/components/file-drop-field";
import { availabilityOptions, collaborationTypes, roles } from "@/shared/constants";
import { useAppData } from "@/shared/lib/app-data-context";
import type { Campus } from "@/shared/types";

const stepTitles = ["기본 정보", "역할 선택", "작업물 검증", "협업 상태", "맞춤 추천"];
const stepDescriptions = [
  "캠퍼스와 학과를 먼저 확인합니다.",
  "프로젝트에서 맡을 수 있는 역할을 표시합니다.",
  "포트폴리오와 본인 역할을 함께 등록합니다.",
  "지금 어떤 방식으로 팀에 참여할 수 있는지 정합니다.",
  "입력한 정보로 어울리는 팀을 먼저 보여줍니다.",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, setProfile, saveProfile, profileSaveState } = useAppData();
  const [step, setStep] = useState(0);

  function toggleRole(role: string) {
    setProfile({
      ...profile,
      roles: profile.roles.includes(role) ? profile.roles.filter((item) => item !== role) : [...profile.roles, role],
    });
  }

  // "아무개@아무거나" 형태만 최소한으로 걸러내는 이메일 형식 검사.
  // 공백/온점 없는 로컬파트, @, 최소 한 번의 온점이 있는 도메인 구조를 요구한다.
  function isValidEmailFormat(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  // 각 단계별 필수값 검증. 통과하지 못하면 "다음" 버튼이 비활성화된다.
  const stepValidation: { valid: boolean; hint: string }[] = [
    {
      valid:
        profile.name.trim().length > 0 &&
        profile.department.trim().length > 0 &&
        isValidEmailFormat(profile.email),
      hint: !profile.name.trim() || !profile.department.trim() || !profile.email.trim()
        ? "이름, 학과, 학교 이메일을 모두 입력해주세요."
        : "학교 이메일 형식이 올바르지 않습니다. (예: student@school.ac.kr)",
    },
    {
      valid: profile.roles.length > 0,
      hint: "역할을 최소 1개 이상 선택해주세요.",
    },
    { valid: true, hint: "" },
    {
      valid: Boolean(profile.availabilityStatus) && Boolean(profile.collaborationType) && Boolean(profile.weeklyHours),
      hint: "협업 상태, 원하는 협업, 주당 가능 시간을 선택해주세요.",
    },
    { valid: true, hint: "" },
  ];

  const currentStepValid = stepValidation[step].valid;

  async function finishOnboarding() {
    await saveProfile({ ...profile, completed: true });
    router.push("/projects");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-16 text-slate-950">
      <section className="mx-auto w-[min(760px,calc(100%-32px))] py-10 lg:py-14">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-teal-700">Onboarding</p>
        <h1 className="mt-2 text-3xl font-black tracking-[0] sm:text-4xl">프로필을 단계별로 작성해요</h1>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          5단계를 모두 마치면 자동으로 추천 프로젝트 페이지로 이동합니다.
        </p>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white shadow-[0_18px_50px_rgba(23,32,42,0.08)]">
          <div className="flex items-start justify-between gap-5 border-b border-slate-200 p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-teal-700">Onboarding</p>
              <h2 className="mt-2 text-2xl font-black tracking-[0]">{stepTitles[step]}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{stepDescriptions[step]}</p>
            </div>
            <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-teal-50 text-sm font-black text-teal-700">
              {step + 1}/5
            </div>
          </div>
          <div className="h-2 bg-slate-100" aria-hidden="true">
            <div className="h-full bg-teal-700 transition-all" style={{ width: `${((step + 1) / 5) * 100}%` }} />
          </div>

          <form className="p-5" onSubmit={(event) => event.preventDefault()}>
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  이름 또는 닉네임
                  <input
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    placeholder="예: 김하린"
                    value={profile.name}
                    onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                  />
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  캠퍼스
                  <select
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    value={profile.campus}
                    onChange={(event) => setProfile({ ...profile, campus: event.target.value as Campus })}
                  >
                    <option>대명캠</option>
                    <option>성서캠</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  학과
                  <input
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    placeholder="예: 영상애니메이션과"
                    value={profile.department}
                    onChange={(event) => setProfile({ ...profile, department: event.target.value })}
                  />
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  학년
                  <select
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    value={profile.grade}
                    onChange={(event) => setProfile({ ...profile, grade: event.target.value })}
                  >
                    <option>1학년</option>
                    <option>2학년</option>
                    <option>3학년</option>
                    <option>4학년</option>
                    <option>졸업 예정</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700 sm:col-span-2">
                  학교 이메일
                  <input
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    placeholder="student@school.ac.kr"
                    type="email"
                    value={profile.email}
                    onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                  />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((role) => {
                    const active = profile.roles.includes(role);

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
                  <input
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    placeholder="Unity, Blender, Photoshop, Figma"
                    value={profile.tools}
                    onChange={(event) => setProfile({ ...profile, tools: event.target.value })}
                  />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4">
                <FileDropField
                  label="대표 작업물"
                  helperText="대표 이미지, 영상 썸네일, 시연 GIF를 올리는 영역"
                  accept={IMAGE_AND_VIDEO_FILE_ACCEPT}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                    외부 링크
                    <input
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      placeholder="ArtStation, GitHub, YouTube"
                      type="url"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                    작업물 내 역할
                    <input
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      placeholder="예: 캐릭터 원화, Unity 구현"
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {["바로 가능", "일정 맞으면 가능", "구경만", "팀 보유 중"].map((status) => (
                    <label
                      className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm font-extrabold text-slate-700"
                      key={status}
                    >
                      <input
                        className="size-4 accent-teal-700"
                        name="status"
                        type="radio"
                        checked={profile.availabilityStatus === status}
                        onChange={() => setProfile({ ...profile, availabilityStatus: status })}
                      />
                      {status}
                    </label>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                    원하는 협업
                    <select
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      value={profile.collaborationType}
                      onChange={(event) => setProfile({ ...profile, collaborationType: event.target.value })}
                    >
                      {collaborationTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                    주당 가능 시간
                    <select
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      value={profile.weeklyHours}
                      onChange={(event) => setProfile({ ...profile, weeklyHours: event.target.value })}
                    >
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
                  {profile.roles.map((role) => (
                    <Tag key={role} label={role} tone="teal" />
                  ))}
                  <Tag label={profile.collaborationType} tone="amber" />
                </div>
              </div>
            )}
          </form>

          {!currentStepValid && (
            <p className="border-t border-slate-200 px-5 pt-4 text-sm font-bold text-rose-600">{stepValidation[step].hint}</p>
          )}

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
              className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              disabled={!currentStepValid || profileSaveState.isSaving}
              onClick={() => {
                if (!currentStepValid) return;
                if (step === 4) {
                  finishOnboarding();
                  return;
                }
                setStep((current) => Math.min(4, current + 1));
              }}
            >
              {step === 4 ? (profileSaveState.isSaving ? "저장 중…" : "프로젝트로 이동") : "다음"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
