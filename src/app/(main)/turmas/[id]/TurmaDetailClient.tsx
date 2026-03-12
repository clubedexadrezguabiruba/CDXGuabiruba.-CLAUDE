"use client";

import { useState } from "react";
import Link from "next/link";
import { useClassDetail } from "@/hooks/useClassDetail";
import { createClient } from "@/lib/supabase/client";

interface TurmaDetailClientProps {
  classId: number;
  isTeacher: boolean;
}

export default function TurmaDetailClient({ classId, isTeacher }: TurmaDetailClientProps) {
  const { classData, members, loading, error, refresh } = useClassDetail(classId);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        Carregando companhia...
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="rounded-xl border bg-red-50 p-4 text-sm text-red-600 shadow-sm">
        Erro: {error ?? "Companhia nao encontrada."}
      </div>
    );
  }

  async function handleRemoveMember(userId: string) {
    if (removing) return;
    setRemoving(userId);

    const supabase = createClient();
    const { error: rpcErr } = await supabase.rpc("remove_class_member", {
      p_class_id: classId,
      p_user_id: userId,
    });

    if (rpcErr) {
      alert("Erro ao remover: " + rpcErr.message);
    }

    setRemoving(null);
    refresh();
  }

  function handleCopyCode() {
    if (!classData) return;
    navigator.clipboard.writeText(classData.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* Header */}
      <div className="mb-4 rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/turmas" className="text-xs text-zinc-400 hover:text-zinc-600">
              &larr; Companhias
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-zinc-900">{classData.name}</h1>
            {!classData.active && (
              <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Inativa
              </span>
            )}
          </div>
        </div>

        {/* Invite code — professor only */}
        {isTeacher && (
          <div className="mt-4 rounded-lg bg-zinc-100 p-3">
            <p className="text-xs text-zinc-500">Codigo de convite</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-widest text-zinc-900">
                {classData.invite_code}
              </span>
              <button
                onClick={handleCopyCode}
                className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="mb-4 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900">
          {isTeacher ? "Membros" : "Colegas"}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {members.length} membro(s)
        </p>

        {members.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Nenhum membro ainda.</p>
        ) : (
          <div className="mt-3 divide-y">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {m.display_name ?? "Sem nome"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Nv. {m.level}
                    {isTeacher && <> &middot; Rating {m.puzzle_rating}</>}
                  </p>
                </div>
                {isTeacher && (
                  <button
                    onClick={() => handleRemoveMember(m.user_id)}
                    disabled={removing === m.user_id}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    {removing === m.user_id ? "Removendo..." : "Remover"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cards de navegação */}
      <div className="space-y-3">
        {isTeacher && (
          <>
            <Link
              href={`/turmas/${classId}/tarefas`}
              className="block rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700">Tarefas</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">Criar e gerenciar tarefas da companhia</p>
                </div>
                <span className="text-zinc-400">&rarr;</span>
              </div>
            </Link>
            <Link
              href={`/turmas/${classId}/relatorio`}
              className="block rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700">Relatorios</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">Progresso dos membros da companhia</p>
                </div>
                <span className="text-zinc-400">&rarr;</span>
              </div>
            </Link>
          </>
        )}
        <Link
          href={`/turmas/${classId}/mural`}
          className="block rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-700">Mural</h3>
              <p className="mt-0.5 text-xs text-zinc-400">Conquistas recentes da companhia</p>
            </div>
            <span className="text-zinc-400">&rarr;</span>
          </div>
        </Link>
      </div>
    </>
  );
}
