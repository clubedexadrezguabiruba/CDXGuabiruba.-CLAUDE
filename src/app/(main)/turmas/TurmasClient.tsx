"use client";

import { useState } from "react";
import Link from "next/link";
import { useClasses } from "@/hooks/useClasses";
import { createClient } from "@/lib/supabase/client";
import type { ClassWithCount } from "@/types/class";
import CreateClassModal from "@/components/teacher/CreateClassModal";

interface TurmasClientProps {
  role: string;
}

export default function TurmasClient({ role }: TurmasClientProps) {
  const { classes, loading, error, refresh } = useClasses(role);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (joining) return;

    const code = inviteCode.trim();
    if (code.length === 0) {
      setJoinError("Digite o codigo de convite.");
      return;
    }

    setJoining(true);
    setJoinError(null);
    setJoinSuccess(null);

    const supabase = createClient();
    const { data, error: rpcErr } = await supabase.rpc("join_class", {
      p_invite_code: code,
    });

    if (rpcErr) {
      setJoinError(rpcErr.message);
      setJoining(false);
      return;
    }

    const result = data as { class_name: string; already_member?: boolean } | null;
    if (result?.already_member) {
      setJoinError("Voce ja faz parte desta companhia.");
    } else {
      setJoinSuccess(result?.class_name ?? "Companhia");
    }
    setInviteCode("");
    setJoining(false);
    refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        Carregando companhias...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-red-50 p-4 text-sm text-red-600 shadow-sm">
        Erro: {error}
      </div>
    );
  }

  return (
    <>
      {/* Professor: botão criar */}
      {role === "professor" && (
        <button
          onClick={() => setShowCreate(true)}
          className="mb-4 w-full rounded-xl border-2 border-dashed border-zinc-300 bg-white py-4 text-sm font-medium text-zinc-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
        >
          + Criar Companhia
        </button>
      )}

      {/* Aluno: entrar com código */}
      {role !== "professor" && (
        <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-700">Entrar em uma companhia</h3>
          <form onSubmit={handleJoin} className="mt-2 flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Codigo de convite"
              maxLength={20}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono tracking-wider focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={joining}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {joining ? "Entrando..." : "Entrar"}
            </button>
          </form>
          {joinError && (
            <p className="mt-2 text-sm text-red-600">{joinError}</p>
          )}
          {joinSuccess && (
            <p className="mt-2 text-sm text-green-600">
              Voce entrou na companhia <strong>{joinSuccess}</strong>!
            </p>
          )}
        </div>
      )}

      {/* Lista de turmas */}
      {classes.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-zinc-500">
            {role === "professor"
              ? "Nenhuma companhia criada ainda. Crie sua primeira companhia acima."
              : "Voce ainda nao faz parte de nenhuma companhia."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/turmas/${cls.id}`}
              className="block rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-900">{cls.name}</h3>
                  {role === "professor" && (
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                      <span>
                        Codigo: <span className="font-mono font-medium text-zinc-700">{cls.invite_code}</span>
                      </span>
                      <span>
                        {(cls as ClassWithCount).member_count ?? 0} membro(s)
                      </span>
                      {!cls.active && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Inativa
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-zinc-400">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal de criação */}
      {showCreate && (
        <CreateClassModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
