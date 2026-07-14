"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "@/shared/components/tag";
import { availabilityOptions, collaborationTypes, roles } from "@/shared/constants";
import { defaultOnboardingProfile } from "@/features/onboarding/lib/onboarding-state";
import { bootstrapAppUserClient } from "@/features/auth/api/auth-api";
import { AuthPanel } from "@/features/auth/components/auth-panel";
import {
  getMyProfileClient,
  updateMyProfileClient,
} from "@/features/profile/api/profile-api";
import type { ProfileFormValues, ProfileRecord } from "@/features/profile/types";
import { listMyPortfoliosClient, savePortfolioClient } from "@/features/portfolios/api/portfolio-api";
import { createClient } from "@/lib/supabase/client";
import type { Campus } from "@/shared/types";

type AuthStateChangeHandler = Parameters<
  ReturnType<typeof createClient>["auth"]["onAuthStateChange"]
>[0];

const stepTitles = ["기본 정보", "역할 선택", "작업물 검증", "협업 상태", "맞춤 추천"];
const stepDescriptions = [
  "캠퍼스와 학과를 먼저 확인합니다.",
  "프로젝트에서 맡을 수 있는 역할을 표시합니다.",
  "포트폴리오와 본인 역할을 함께 등록합니다.",
  "지금 어떤 방식으로 팀에 참여할 수 있는지 정합니다.",
  "입력한 정보로 어울리는 팀을 먼저 보여줍니다.",
];

function parsePortfolioThumbnail(description: string) {
  const prefix = "썸네일: ";

  if (description.startsWith(prefix)) {
    return description.slice(prefix.length).trim();
  }

  return "";
}

function mapProfileRecordToOnboardingState(data: ProfileRecord, fallbackEmail: string) {
  return {
    name: data.displayName,
    campus: (data.campus || "대명캠") as Campus,
    department: data.department,
    grade: data.grade || "1학년",
    email: data.email || fallbackEmail,
    roles: data.roleTags,
    tools: data.techStack,
    availabilityStatus: data.availabilityStatus || "바로 가능",
    collaborationType: data.collaborationType || "졸업작품",
    weeklyHours: data.weeklyHours || "4-7시간",
    completed: data.onboardingCompleted,
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(defaultOnboardingProfile);
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(0);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [profileLoadMessage, setProfileLoadMessage] = useState("");
  const [portfolioExternalUrl, setPortfolioExternalUrl] = useState("");
  const [portfolioThumbnailUrl, setPortfolioThumbnailUrl] = useState("");
  const [portfolioRoleInWork, setPortfolioRoleInWork] = useState("");

  const resetLocalOnboardingState = useCallback(() => {
    setStep(0);
    setSaveMessage("");
    setProfileLoadMessage("");
    setPortfolioExternalUrl("");
    setPortfolioThumbnailUrl("");
    setPortfolioRoleInWork("");
    setProfile(defaultOnboardingProfile);
  }, []);

  const prepareForSignedInUser = useCallback(
    (email: string) => {
      setStep(0);
      setSaveMessage("");
      setProfileLoadMessage("");
      setPortfolioExternalUrl("");
      setPortfolioThumbnailUrl("");
      setPortfolioRoleInWork("");
      setProfile({ ...defaultOnboardingProfile, email });
    },
    [],
  );

  useEffect(() => {
    let active = true;

    async function syncSession() {
      const { data } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      const email = data.session?.user.email ?? null;
      setSessionEmail(email);

      if (email) {
        prepareForSignedInUser(email);
      } else {
        resetLocalOnboardingState();
      }

      setLoadingSession(false);
    }

    void syncSession();

    const onAuthStateChange: AuthStateChangeHandler = async (_event, session) => {
      const email = session?.user.email ?? null;
      setSessionEmail(email);
      setLoadingSession(false);

      if (email) {
        prepareForSignedInUser(email);
      } else {
        resetLocalOnboardingState();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(onAuthStateChange);

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [prepareForSignedInUser, resetLocalOnboardingState, supabase]);

  useEffect(() => {
    if (!sessionEmail) {
      return;
    }

    let active = true;

    async function loadSavedProfile() {
      setLoadingProfile(true);
      setProfileLoadMessage("");
      const email = sessionEmail;

      try {
        let data;

        try {
          data = await getMyProfileClient();
        } catch {
          await bootstrapAppUserClient();
          data = await getMyProfileClient();
        }

        if (!active) {
          return;
        }

        setStep(data.onboardingStep);
        setProfile(mapProfileRecordToOnboardingState(data, email || ""));

        try {
          const portfolios = await listMyPortfoliosClient();

          if (!active) {
            return;
          }

          if (portfolios.length) {
            const portfolio = portfolios[0];

            setPortfolioExternalUrl(portfolio.externalUrl);
            setPortfolioThumbnailUrl(parsePortfolioThumbnail(portfolio.description));
            setPortfolioRoleInWork(portfolio.roleInWork);
          }
        } catch {
          // Portfolio hydration is optional for resume.
        }
      } catch {
        if (!active) {
          return;
        }

        setProfileLoadMessage("저장된 프로필을 불러오지 못했습니다. 기본값으로 온보딩을 시작합니다.");
        setStep(0);
        setProfile({ ...defaultOnboardingProfile, email: email || "" });
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    }

    void loadSavedProfile();

    return () => {
      active = false;
    };
  }, [sessionEmail]);

  function toggleRole(role: string) {
    setProfile({
      ...profile,
      roles: profile.roles.includes(role) ? profile.roles.filter((item) => item !== role) : [...profile.roles, role],
    });
  }

  async function finishOnboarding() {
    setSaving(true);
    setSaveMessage("프로필 저장 중입니다.");

    try {
      let existingProfile: ProfileRecord | null = null;

      try {
        existingProfile = await getMyProfileClient();
      } catch {
        existingProfile = null;
      }

      const collaborationStatus =
        profile.availabilityStatus === "구경만" || profile.availabilityStatus === "팀 보유 중" ? "CLOSED" : "OPEN";

      const trimmedExternalUrl = portfolioExternalUrl.trim();
      const trimmedRoleInWork = portfolioRoleInWork.trim();

      if (!trimmedExternalUrl || !trimmedRoleInWork) {
        setStep(2);
        throw new Error("포트폴리오 링크와 작업물 내 역할을 입력해야 온보딩을 완료할 수 있습니다.");
      }

      await savePortfolioClient({
        title: profile.name.trim() || "대표 작업물",
        description: portfolioThumbnailUrl.trim()
          ? `썸네일: ${portfolioThumbnailUrl.trim()}`
          : "",
        externalUrl: trimmedExternalUrl,
        roleInWork: trimmedRoleInWork,
        tools: profile.tools
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        coverImageName: "",
      });

      const profilePayload: ProfileFormValues = {
        displayName: profile.name,
        campus: profile.campus,
        studentId: existingProfile?.studentId ?? "",
        department: profile.department,
        grade: profile.grade,
        bio: existingProfile?.bio ?? "",
        roleTags: profile.roles,
        techStack: profile.tools,
        availabilityStatus: profile.availabilityStatus,
        collaborationType: profile.collaborationType,
        weeklyHours: profile.weeklyHours,
        collaborationStatus,
        onboardingCompleted: true,
      };

      await updateMyProfileClient(profilePayload);

      setProfile({ ...profile, completed: true });
      setSaveMessage("프로필 저장이 완료되었습니다. 프로젝트 화면으로 이동합니다.");
      router.push("/projects");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "프로필 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-16 text-slate-950">
      <section className="mx-auto w-full max-w-[760px] px-4 py-10 lg:py-14">
        <h1 className="mt-2 text-3xl font-black tracking-[0] sm:text-4xl">프로필을 단계별로 작성해요</h1>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          기본 정보를 입력하고, 나에게 맞는 프로젝트를 찾아보세요.
        </p>

        {loadingSession || (sessionEmail && loadingProfile) ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500 shadow-sm">
            {loadingSession ? "로그인 상태를 확인하고 있습니다." : "저장된 프로필을 불러오고 있습니다."}
          </div>
        ) : null}

        {!loadingSession && !loadingProfile && !sessionEmail ? (
          <div className="mt-8 grid gap-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
              온보딩 내용을 저장하려면 먼저 로그인 또는 회원가입이 필요합니다.
            </div>
            <AuthPanel onboardingOnly />
          </div>
        ) : null}

        {!loadingSession && !loadingProfile && sessionEmail && profileLoadMessage ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-600">
            {profileLoadMessage}
          </div>
        ) : null}

        {!loadingSession && !loadingProfile && sessionEmail ? (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white shadow-[0_18px_50px_rgba(23,32,42,0.08)]">
          <div className="flex items-start justify-between gap-5 border-b border-slate-200 p-5">
            <div className="min-w-0">
              <h2 className="mt-2 break-words text-2xl font-black tracking-[0]">{stepTitles[step]}</h2>
              <p className="mt-1 break-words text-sm leading-6 text-slate-500">{stepDescriptions[step]}</p>
            </div>
            <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-teal-50 text-sm font-black text-teal-700">
              {step + 1}/5
            </div>
          </div>
          <div className="h-2 bg-slate-100" aria-hidden="true">
            <div className="h-full bg-teal-700 transition-all" style={{ width: `${((step + 1) / 5) * 100}%` }} />
          </div>

          <div className="break-all border-b border-slate-100 px-5 py-3 text-sm font-bold text-slate-500">
            로그인 계정: <span className="text-slate-900">{sessionEmail}</span>
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
                    placeholder="student@kmu.ac.kr"
                    type="email"
                    value={sessionEmail ?? ""}
                    readOnly
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-extrabold text-slate-700 sm:col-span-2">
                    외부 포트폴리오 링크
                    <input
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      placeholder="ArtStation, GitHub, YouTube"
                      type="url"
                      value={portfolioExternalUrl}
                      onChange={(event) => setPortfolioExternalUrl(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                    대표 썸네일 URL
                    <input
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      placeholder="https://example.com/thumbnail.jpg"
                      type="url"
                      value={portfolioThumbnailUrl}
                      onChange={(event) => setPortfolioThumbnailUrl(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                    작업물 내 역할
                    <input
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-medium outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      placeholder="예: 캐릭터 원화, Unity 구현"
                      value={portfolioRoleInWork}
                      onChange={(event) => setPortfolioRoleInWork(event.target.value)}
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
                  <h3 className="font-black text-teal-950">작성 내용 확인</h3>
                  <p className="mt-2 text-sm leading-6 text-teal-900">
                    입력한 정보를 바탕으로 함께할 프로젝트를 찾아볼 수 있어요.
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

          {saveMessage ? (
            <div className="px-5 pb-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                {saveMessage}
              </div>
            </div>
          ) : null}

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
              disabled={saving || loadingProfile}
              onClick={() => {
                if (step === 4) {
                  void finishOnboarding();
                  return;
                }
                setStep((current) => Math.min(4, current + 1));
              }}
            >
              {step === 4 ? (saving ? "저장 중..." : "프로필 저장 후 이동") : "다음"}
            </button>
          </div>
        </div>
        ) : null}
      </section>
    </main>
  );
}
