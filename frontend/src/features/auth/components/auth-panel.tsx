"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { bootstrapAppUserClient } from "@/features/auth/api/auth-api";
import { isSchoolEmail, schoolEmailMessage } from "@/features/auth/lib/school-email";
import { getMyProfileClient, updateMyProfileClient } from "@/features/profile/api/profile-api";
import { createClient } from "@/lib/supabase/client";

type AuthStateChangeHandler = Parameters<
  ReturnType<typeof createClient>["auth"]["onAuthStateChange"]
>[0];

type Mode = "sign-up" | "sign-in";

type AuthMessageTone = "neutral" | "success" | "error";

type AuthMessage = {
  tone: AuthMessageTone;
  text: string;
};

type ProfileFormState = {
  email: string;
  studentId: string;
  department: string;
  grade: string;
  bio: string;
  techStack: string;
  collaborationStatus: "OPEN" | "CLOSED";
};

function emptyProfileState(): ProfileFormState {
  return {
    email: "",
    studentId: "",
    department: "",
    grade: "",
    bio: "",
    techStack: "",
    collaborationStatus: "OPEN",
  };
}

function initialAuthMessage(): AuthMessage {
  return {
    tone: "neutral",
    text: "이 화면에서 회원가입과 로그인을 바로 테스트할 수 있습니다.",
  };
}

function initialProfileMessage(): AuthMessage {
  return {
    tone: "neutral",
    text: "로그인 후에는 현재 사용자 기준 프로필 조회와 저장이 가능합니다.",
  };
}

function messageClassName(tone: AuthMessageTone) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<AuthMessage>(initialAuthMessage);
  const [profilePending, setProfilePending] = useState(false);
  const [profileMessage, setProfileMessage] = useState<AuthMessage>(initialProfileMessage);
  const [profile, setProfile] = useState<ProfileFormState>(emptyProfileState);
  const redirectTo = searchParams.get("next") || "/onboarding";

  async function loadProfile() {
    const data = await getMyProfileClient();

    setProfile({
      email: data.email,
      studentId: data.studentId,
      department: data.department,
      grade: data.grade,
      bio: data.bio,
      techStack: data.techStack,
      collaborationStatus: data.collaborationStatus,
    });
    setProfileMessage({
      tone: "success",
      text: "현재 사용자 프로필을 불러왔습니다.",
    });
  }

  useEffect(() => {
    let active = true;

    async function syncSession() {
      const { data } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      const currentEmail = data.session?.user.email ?? null;
      setSessionEmail(currentEmail);

      if (!currentEmail) {
        setProfile(emptyProfileState());
        setProfileMessage(initialProfileMessage());
        return;
      }

      try {
        await loadProfile();
      } catch (error) {
        if (!active) {
          return;
        }

        setProfileMessage({
          tone: "error",
          text: error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.",
        });
      }
    }

    void syncSession();

    const onAuthStateChange: AuthStateChangeHandler = async (_event, session) => {
      setSessionEmail(session?.user.email ?? null);

      if (!session?.user.email) {
        setProfile(emptyProfileState());
        setProfileMessage(initialProfileMessage());
        return;
      }

      try {
        await loadProfile();
      } catch (error) {
        if (!active) {
          return;
        }

        setProfileMessage({
          tone: "error",
          text: error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.",
        });
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(onAuthStateChange);

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage({
      tone: "neutral",
      text: mode === "sign-up" ? "회원가입 처리 중입니다." : "로그인 처리 중입니다.",
    });

    try {
      if (!isSchoolEmail(email)) {
        setMessage({ tone: "error", text: schoolEmailMessage() });
        return;
      }

      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          setMessage({ tone: "error", text: error.message });
          return;
        }

        if (!data.user?.email) {
          setMessage({
            tone: "error",
            text: "회원가입은 되었지만 사용자 정보를 읽지 못했습니다.",
          });
          return;
        }

        if (data.session) {
          await bootstrapAppUserClient();
          await loadProfile();
          setMessage({
            tone: "success",
            text: "회원가입과 기본 프로필 생성이 완료되었습니다.",
          });
          router.push(redirectTo);
        } else {
          setMessage({
            tone: "success",
            text: "회원가입은 완료됐지만 현재 세션이 없습니다. 이메일 인증 설정을 확인해주세요.",
          });
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ tone: "error", text: error.message });
        return;
      }

      await bootstrapAppUserClient();
      await loadProfile();
      setMessage({
        tone: "success",
        text: "로그인 성공. 온보딩과 프로젝트 화면으로 이동할 수 있습니다.",
      });
      router.push(redirectTo);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "인증 처리에 실패했습니다.",
      });
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    setPending(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage({ tone: "error", text: error.message });
        return;
      }

      setMessage({
        tone: "success",
        text: "로그아웃되었습니다.",
      });
      setProfile(emptyProfileState());
      setProfileMessage(initialProfileMessage());
    } finally {
      setPending(false);
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfilePending(true);
    setProfileMessage({
      tone: "neutral",
      text: "프로필 저장 중입니다.",
    });

    try {
      const existingProfile = await getMyProfileClient();

      const data = await updateMyProfileClient({
        displayName: existingProfile.displayName,
        campus: existingProfile.campus,
        studentId: profile.studentId,
        department: profile.department,
        grade: profile.grade,
        bio: profile.bio,
        roleTags: existingProfile.roleTags,
        techStack: profile.techStack,
        availabilityStatus: existingProfile.availabilityStatus,
        collaborationType: existingProfile.collaborationType,
        weeklyHours: existingProfile.weeklyHours,
        collaborationStatus: profile.collaborationStatus,
        onboardingCompleted: existingProfile.onboardingCompleted,
      });

      setProfile({
        email: data.email,
        studentId: data.studentId,
        department: data.department,
        grade: data.grade,
        bio: data.bio,
        techStack: data.techStack,
        collaborationStatus: data.collaborationStatus,
      });
      setProfileMessage({
        tone: "success",
        text: "프로필 저장이 완료되었습니다.",
      });
    } catch (error) {
      setProfileMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "프로필 저장에 실패했습니다.",
      });
    } finally {
      setProfilePending(false);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-teal-700">Auth</p>
            <h2 className="mt-2 text-3xl font-black tracking-[0]">회원가입 / 로그인</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Supabase Auth 기준으로 계정을 만들고, 로그인 후 현재 사용자 프로필까지 바로 확인합니다.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
            현재 세션: {sessionEmail ?? "없음"}
          </div>
        </div>

        <div className="mt-6 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            className={`min-h-10 rounded-lg px-4 text-sm font-extrabold transition ${
              mode === "sign-up" ? "bg-teal-700 text-white" : "text-slate-600"
            }`}
            onClick={() => setMode("sign-up")}
          >
            회원가입
          </button>
          <button
            type="button"
            className={`min-h-10 rounded-lg px-4 text-sm font-extrabold transition ${
              mode === "sign-in" ? "bg-slate-950 text-white" : "text-slate-600"
            }`}
            onClick={() => setMode("sign-in")}
          >
            로그인
          </button>
        </div>

        <form className="mt-6 grid gap-4 md:max-w-xl" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            이메일
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              type="email"
              placeholder="student@kmu.ac.kr"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            비밀번호
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              type="password"
              placeholder="8자 이상 입력"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45"
              type="submit"
              disabled={pending}
            >
              {pending ? "처리 중..." : mode === "sign-up" ? "회원가입 요청" : "로그인"}
            </button>

            <button
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-950 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              onClick={handleSignOut}
              disabled={pending}
            >
              로그아웃
            </button>

            <button
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-950 transition hover:border-slate-400"
              type="button"
              onClick={() => router.push(redirectTo)}
            >
              원래 화면으로 이동
            </button>
          </div>
        </form>

        <div className={`mt-5 rounded-lg border px-4 py-3 text-sm font-bold ${messageClassName(message.tone)}`}>
          {message.text}
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">Profile</p>
            <h3 className="mt-2 text-2xl font-black tracking-[0]">현재 사용자 프로필</h3>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              로그인된 사용자 기준으로 `profiles` 테이블을 읽고 저장합니다.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
            기준 이메일: {profile.email || "로그인 필요"}
          </div>
        </div>

        <form className="mt-6 grid gap-4 md:max-w-2xl" onSubmit={handleProfileSubmit}>
          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            학번
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              value={profile.studentId}
              onChange={(event) => setProfile((current) => ({ ...current, studentId: event.target.value }))}
              disabled={!sessionEmail || profilePending}
            />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            학과
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              value={profile.department}
              onChange={(event) => setProfile((current) => ({ ...current, department: event.target.value }))}
              disabled={!sessionEmail || profilePending}
            />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            학년
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              value={profile.grade}
              onChange={(event) => setProfile((current) => ({ ...current, grade: event.target.value }))}
              disabled={!sessionEmail || profilePending}
            />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            자기소개
            <textarea
              className="min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              value={profile.bio}
              onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
              disabled={!sessionEmail || profilePending}
            />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            기술 스택
            <textarea
              className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              value={profile.techStack}
              onChange={(event) => setProfile((current) => ({ ...current, techStack: event.target.value }))}
              disabled={!sessionEmail || profilePending}
              placeholder="예: Next.js, Supabase, Spring Boot"
            />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            협업 가능 상태
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-medium outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              value={profile.collaborationStatus}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  collaborationStatus: event.target.value === "CLOSED" ? "CLOSED" : "OPEN",
                }))
              }
              disabled={!sessionEmail || profilePending}
            >
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </label>

          <div className="pt-2">
            <button
              className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
              type="submit"
              disabled={!sessionEmail || profilePending}
            >
              {profilePending ? "저장 중..." : "프로필 저장"}
            </button>
          </div>
        </form>

        <div className={`mt-5 rounded-lg border px-4 py-3 text-sm font-bold ${messageClassName(profileMessage.tone)}`}>
          {profileMessage.text}
        </div>
      </section>
    </section>
  );
}
