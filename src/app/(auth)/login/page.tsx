"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => searchParams.get("next") || "/dashboard", [searchParams]);

  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) return setError(error.message);
    router.replace(next);
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) return setError(error.message);
    setError("Conta criada! Agora faça login (ou confirme o email, se seu projeto exigir).");
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border p-5">
      <h1 className="text-xl font-semibold">Login</h1>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={signInWithPassword} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="voce@exemplo.com"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Senha</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          disabled={loading}
          className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={signUp}
          disabled={loading}
          className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60"
        >
          Criar conta
        </button>
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60"
        >
          Google
        </button>
      </div>

      <p className="text-xs text-zinc-600">
        Configure no Supabase o Redirect URL para{" "}
        <span className="font-mono">http://localhost:3000/auth/callback</span>.
      </p>
    </div>
  );
}
