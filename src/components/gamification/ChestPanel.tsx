"use client";

import { useState } from "react";
import { useChests, type PendingChest, type ClaimedItem } from "@/hooks/useChests";
import ChestOpeningModal from "./ChestOpeningModal";

const SOURCE_LABELS: Record<string, string> = {
  welcome: "Boas-vindas",
  level_up: "Nível alcançado",
  daily_missions: "Missões do dia",
  achievement: "Conquista",
  streak_bonus: "Bônus de sequência",
};

export default function ChestPanel() {
  const { chests, loading, error, openChest } = useChests();
  const [opening, setOpening] = useState<number | null>(null);
  const [claimedItem, setClaimedItem] = useState<ClaimedItem | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  async function handleOpen(chest: PendingChest) {
    if (opening !== null) return; // já abrindo outro
    setOpening(chest.id);
    setOpenError(null);

    try {
      const result = await openChest(chest.id);

      if (result.alreadyClaimed) {
        // já foi aberto — baú removido da lista pelo hook
        setOpening(null);
        return;
      }

      // mostra modal de revelação
      setClaimedItem(result.item);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao abrir baú";
      setOpenError(msg);
      setOpening(null);
    }
  }

  function handleCloseModal() {
    setClaimedItem(null);
    setOpening(null);
  }

  if (loading) {
    return (
      <div className="rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Baús</h2>
        <div className="flex items-center justify-center py-4 text-sm text-zinc-400">
          Carregando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Baús</h2>
        <p className="text-sm text-red-600">Erro: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Baús</h2>
          {chests.length > 0 && (
            <span className="text-sm font-medium text-zinc-500">
              {chests.length} pendente{chests.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {chests.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">
            Nenhum baú pendente.
          </p>
        ) : (
          <div className="space-y-2">
            {chests.map((chest) => (
              <div
                key={chest.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <span className="text-sm font-medium">Baú</span>
                    <span className="ml-1.5 text-xs text-zinc-400">
                      {SOURCE_LABELS[chest.source_type] ?? chest.source_type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpen(chest)}
                  disabled={opening !== null}
                  className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                  {opening === chest.id ? "Abrindo..." : "Abrir"}
                </button>
              </div>
            ))}
          </div>
        )}

        {openError && (
          <p className="mt-2 text-sm text-red-600">{openError}</p>
        )}
      </div>

      {claimedItem && (
        <ChestOpeningModal item={claimedItem} onClose={handleCloseModal} />
      )}
    </>
  );
}
