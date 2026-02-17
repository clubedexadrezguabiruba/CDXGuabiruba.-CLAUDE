"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}

function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(
    () => searchParams.get("next") || "/dashboard",
    [searchParams]
  );

  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (password.length < 6) {
      setLoading(false);
      return setError("A senha deve ter no mínimo 6 caracteres.");
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);

    if (error) return setError(error.message);

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border p-5">
        <h1 className="text-xl font-semibold">Conta criada!</h1>
        <p className="text-sm text-zinc-600">
          Se a confirmação por email estiver ativada, verifique sua caixa de
          entrada. Caso contrário, você já pode fazer login.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Ir para Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border p-5">
      <h1 className="text-xl font-semibold">Criar Conta</h1>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSignUp} className="space-y-3">
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
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600">
        Já tem conta?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-medium underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
