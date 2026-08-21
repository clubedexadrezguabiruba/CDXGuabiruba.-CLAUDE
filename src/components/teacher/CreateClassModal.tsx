"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CreateClassModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateClassModal({ onClose, onCreated }: CreateClassModalProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; invite_code: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("create_class", {
      p_name: trimmed,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSubmitting(false);
      return;
    }

    const json = data as { name: string; invite_code: string };
    setResult(json);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {result ? (
          <>
            <h2 className="text-lg font-bold text-zinc-900">Turma Criada!</h2>
            <p className="mt-2 text-sm text-zinc-600">
              <strong>{result.name}</strong> foi criada com sucesso.
            </p>
            <div className="mt-4 rounded-lg bg-zinc-100 p-4 text-center">
              <p className="text-xs text-zinc-500">Codigo de convite</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-zinc-900">
                {result.invite_code}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Compartilhe este codigo com seus alunos.
              </p>
            </div>
            <button
              onClick={onCreated}
              className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Fechar
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-zinc-900">Criar Turma</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Escolha um nome para sua nova turma.
            </p>
            <form onSubmit={handleSubmit} className="mt-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da turma"
                maxLength={100}
                autoFocus
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border bg-white py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
