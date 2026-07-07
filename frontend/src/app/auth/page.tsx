import { AuthPanel } from "@/features/auth/components/auth-panel";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-10 text-slate-950 lg:py-14">
      <section className="mx-auto w-full max-w-4xl">
        <AuthPanel />
      </section>
    </main>
  );
}
