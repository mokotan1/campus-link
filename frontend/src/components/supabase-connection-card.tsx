"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ConnectionState = "idle" | "checking" | "connected" | "error";

export function SupabaseConnectionCard() {
  const [status, setStatus] = useState<ConnectionState>("idle");
  const [message, setMessage] = useState("아직 연결 확인을 시작하지 않았습니다.");

  useEffect(() => {
    let mounted = true;

    async function checkConnection() {
      setStatus("checking");
      setMessage("Supabase 세션 상태를 확인하는 중입니다.");

      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (error) {
          setStatus("error");
          setMessage(`연결 확인 실패: ${error.message}`);
          return;
        }

        if (data.session) {
          setStatus("connected");
          setMessage("Supabase 연결 성공. 현재 로그인 세션이 있습니다.");
          return;
        }

        setStatus("connected");
        setMessage("Supabase 연결 성공. 현재 로그인 세션은 없습니다.");
      } catch (error) {
        if (!mounted) {
          return;
        }

        setStatus("error");
        setMessage(
          error instanceof Error
            ? `연결 확인 실패: ${error.message}`
            : "연결 확인 중 알 수 없는 오류가 발생했습니다."
        );
      }
    }

    checkConnection();

    return () => {
      mounted = false;
    };
  }, []);

  const dotColor =
    status === "connected"
      ? "bg-emerald-400"
      : status === "error"
        ? "bg-rose-400"
        : "bg-amber-400";

  const title =
    status === "connected"
      ? "Supabase 연결 확인 완료"
      : status === "error"
        ? "Supabase 연결 오류"
        : "Supabase 연결 확인 중";

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 flex items-center gap-3">
        <span className={`inline-flex h-3 w-3 rounded-full ${dotColor}`} />
        <p className="text-sm text-zinc-300">{message}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        이 상태는 프론트에서 Supabase 클라이언트를 실제로 만들고, 세션 조회까지
        시도한 결과입니다.
      </p>
    </section>
  );
}
