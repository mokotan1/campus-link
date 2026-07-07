"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type Mode = "sign-up" | "sign-in";

type AuthMessage = {
  tone: "neutral" | "success" | "error";
  text: string;
};

type ProfileMessage = {
  tone: "neutral" | "success" | "error";
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

function initialMessage(): AuthMessage {
  return {
    tone: "neutral",
    text: "이 화면에서 Supabase Auth 기준 회원가입과 로그인을 바로 테스트할 수 있습니다.",
  };
}

function initialProfileMessage(): ProfileMessage {
  return {
    tone: "neutral",
    text: "로그인된 사용자 기준으로 프로필을 조회하고 저장할 수 있습니다.",
  };
}

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

async function bootstrapAppUser(authUserId: string, userEmail: string) {
  const response = await fetch("/api/auth/bootstrap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authUserId, email: userEmail }),
  });

  const payload = (await response.json()) as {
    success?: boolean;
    message?: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "사용자 기본 데이터 생성에 실패했습니다.");
  }
}

export function AuthPanel() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<AuthMessage>(initialMessage);
  const [profilePending, setProfilePending] = useState(false);
  const [profile, setProfile] = useState<ProfileFormState>(emptyProfileState);
  const [profileMessage, setProfileMessage] =
    useState<ProfileMessage>(initialProfileMessage);

  async function loadProfile() {
    const response = await fetch("/api/profiles/me", {
      method: "GET",
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      success?: boolean;
      message?: string;
      data?: ProfileFormState;
    };

    if (!response.ok || !payload.success || !payload.data) {
      throw new Error(payload.message ?? "프로필을 불러오지 못했습니다.");
    }

    setProfile(payload.data);
    setProfileMessage({
      tone: "success",
      text: "현재 로그인 사용자의 프로필을 불러왔습니다.",
    });
  }

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSessionEmail(data.session?.user.email ?? null);

      if (data.session?.user.email) {
        try {
          await loadProfile();
        } catch (error) {
          if (!mounted) {
            return;
          }

          const text =
            error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.";
          setProfileMessage({ tone: "error", text });
        }
        return;
      }

      setProfile(emptyProfileState());
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);

      if (!session?.user.email) {
        setProfile(emptyProfileState());
        setProfileMessage(initialProfileMessage());
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage({
      tone: "neutral",
      text: mode === "sign-up" ? "회원가입 요청 중입니다." : "로그인 요청 중입니다.",
    });

    try {
      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage({ tone: "error", text: error.message });
          return;
        }

        const authUserId = data.user?.id;
        const userEmail = data.user?.email;

        if (!authUserId || !userEmail) {
          setMessage({
            tone: "error",
            text: "회원가입은 되었지만 사용자 정보를 읽지 못했습니다.",
          });
          return;
        }

        await bootstrapAppUser(authUserId, userEmail);
        await loadProfile();

        setMessage({
          tone: "success",
          text: data.session
            ? "회원가입과 기본 프로필 생성이 완료되었습니다."
            : "회원가입은 완료됐지만 현재 세션이 없습니다. Supabase에서 이메일 인증 설정을 다시 확인해주세요.",
        });
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

      await loadProfile();

      setMessage({
        tone: "success",
        text: "로그인 성공. 현재 세션이 생성되었습니다.",
      });
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    setPending(true);
    setMessage({ tone: "neutral", text: "로그아웃 처리 중입니다." });

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage({ tone: "error", text: error.message });
      setPending(false);
      return;
    }

    setMessage({
      tone: "success",
      text: "로그아웃되었습니다. 현재는 세션이 없는 상태입니다.",
    });
    setProfile(emptyProfileState());
    setProfileMessage(initialProfileMessage());
    setPending(false);
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfilePending(true);
    setProfileMessage({ tone: "neutral", text: "프로필 저장 중입니다." });

    try {
      const response = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: ProfileFormState;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message ?? "프로필 저장에 실패했습니다.");
      }

      setProfile(payload.data);
      setProfileMessage({
        tone: "success",
        text: "프로필 저장이 완료되었습니다.",
      });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "프로필 저장에 실패했습니다.";
      setProfileMessage({ tone: "error", text });
    } finally {
      setProfilePending(false);
    }
  }

  const messageStyle =
    message.tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : message.tone === "error"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
        : "border-zinc-800 bg-zinc-950 text-zinc-300";

  const profileMessageStyle =
    profileMessage.tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : profileMessage.tone === "error"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
        : "border-zinc-800 bg-zinc-950 text-zinc-300";

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Auth 테스트</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Supabase Auth 기준으로 이메일 회원가입과 로그인을 바로 확인하는
            초기 화면입니다.
          </p>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
          현재 세션: {sessionEmail ?? "없음"}
        </div>
      </div>

      <div className="mt-5 inline-flex rounded-md border border-zinc-800 bg-zinc-950 p-1">
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            mode === "sign-up"
              ? "bg-emerald-500/20 text-emerald-200"
              : "text-zinc-400"
          }`}
          onClick={() => setMode("sign-up")}
        >
          회원가입
        </button>
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            mode === "sign-in"
              ? "bg-emerald-500/20 text-emerald-200"
              : "text-zinc-400"
          }`}
          onClick={() => setMode("sign-in")}
        >
          로그인
        </button>
      </div>

      <form className="mt-5 grid gap-4 md:max-w-xl" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm">
          <span className="text-zinc-300">이메일</span>
          <input
            className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-50 outline-none ring-0 placeholder:text-zinc-500"
            type="email"
            placeholder="campuslink@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-zinc-300">비밀번호</span>
          <input
            className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-50 outline-none ring-0 placeholder:text-zinc-500"
            type="password"
            placeholder="8자 이상 입력"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending
              ? "처리 중..."
              : mode === "sign-up"
                ? "회원가입 요청"
                : "로그인"}
          </button>

          <button
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleSignOut}
            disabled={pending}
          >
            로그아웃
          </button>
        </div>
      </form>

      <div className={`mt-5 rounded-md border px-4 py-3 text-sm ${messageStyle}`}>
        {message.text}
      </div>

      <section className="mt-8 rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-base font-semibold">프로필 저장 테스트</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              로그인된 사용자 기준으로 `profiles` 테이블을 조회하고 수정합니다.
            </p>
          </div>

          <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
            프로필 기준 이메일: {profile.email || "로그인 필요"}
          </div>
        </div>

        <form className="mt-5 grid gap-4 md:max-w-2xl" onSubmit={handleProfileSubmit}>
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">학번</span>
            <input
              className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-50 outline-none placeholder:text-zinc-500"
              value={profile.studentId}
              onChange={(event) =>
                setProfile((current) => ({ ...current, studentId: event.target.value }))
              }
              disabled={!sessionEmail || profilePending}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">학과</span>
            <input
              className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-50 outline-none placeholder:text-zinc-500"
              value={profile.department}
              onChange={(event) =>
                setProfile((current) => ({ ...current, department: event.target.value }))
              }
              disabled={!sessionEmail || profilePending}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">학년</span>
            <input
              className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-50 outline-none placeholder:text-zinc-500"
              value={profile.grade}
              onChange={(event) =>
                setProfile((current) => ({ ...current, grade: event.target.value }))
              }
              disabled={!sessionEmail || profilePending}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">자기소개</span>
            <textarea
              className="min-h-28 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
              value={profile.bio}
              onChange={(event) =>
                setProfile((current) => ({ ...current, bio: event.target.value }))
              }
              disabled={!sessionEmail || profilePending}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">기술 스택</span>
            <textarea
              className="min-h-24 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-50 outline-none placeholder:text-zinc-500"
              value={profile.techStack}
              onChange={(event) =>
                setProfile((current) => ({ ...current, techStack: event.target.value }))
              }
              disabled={!sessionEmail || profilePending}
              placeholder="예: React, Next.js, Spring Boot"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">협업 가능 상태</span>
            <select
              className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-zinc-50 outline-none"
              value={profile.collaborationStatus}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  collaborationStatus:
                    event.target.value === "CLOSED" ? "CLOSED" : "OPEN",
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
              className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={!sessionEmail || profilePending}
            >
              {profilePending ? "저장 중..." : "프로필 저장"}
            </button>
          </div>
        </form>

        <div
          className={`mt-5 rounded-md border px-4 py-3 text-sm ${profileMessageStyle}`}
        >
          {profileMessage.text}
        </div>
      </section>
    </section>
  );
}
