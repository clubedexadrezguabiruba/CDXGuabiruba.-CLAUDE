import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">CdxGuabiruba — Base</h1>
          <p className="text-sm text-zinc-600">
            Projeto inicial (Next.js + Tailwind v4 + Supabase SSR).
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50">
              Ir para Login
            </Link>
            <Link href="/dashboard" className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50">
              Ir para Dashboard
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
