"use client";

import { useState } from "react";
import { useChests, type PendingChest, type ClaimResult } from "@/hooks/useChests";
import ChestOpeningModal from "./ChestOpeningModal";

const SOURCE_LABELS: Record<string, string> = {
  welcome: "Boas-vindas",
  level_up: "Nível alcançado",
  daily_missions: "Missões do dia",
  achievement: "Conquista",
  streak_bonus: "Bônus de sequência",
};

const VISIBLE_LIMIT = 3;

export default function ChestPanel() {
  const { chests, loading, error, openChest } = useChests();
  const [opening, setOpening] = useState<number | null>(null);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function handleOpen(chest: PendingChest) {
    if (opening !== null) return;
    setOpening(chest.id);
    setOpenError(null);

    try {
      const result = await openChest(chest.id);

      if (result.alreadyClaimed) {
        setOpening(null);
        return;
      }

      setClaimResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao abrir baú";
      setOpenError(msg);
      setOpening(null);
    }
  }

  function handleCloseModal() {
    setClaimResult(null);
    setOpening(null);
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Baús</h2>
        <div className="flex items-center justify-center py-4 text-sm text-zinc-400">
          Carregando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Baús</h2>
        <p className="text-sm text-red-600">Erro: {error}</p>
      </div>
    );
  }

  const visibleChests = expanded ? chests : chests.slice(0, VISIBLE_LIMIT);
  const hiddenCount = chests.length - VISIBLE_LIMIT;

  return (
    <>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
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
            {visibleChests.map((chest) => (
              <div
                key={chest.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:shadow"
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
                  className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                  {opening === chest.id ? "Abrindo..." : "Abrir"}
                </button>
              </div>
            ))}

            {!expanded && hiddenCount > 0 && (
              <button
                onClick={() => setExpanded(true)}
                className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
              >
                Ver mais {hiddenCount} {hiddenCount === 1 ? "baú" : "baús"}
              </button>
            )}
          </div>
        )}

        {openError && (
          <p className="mt-2 text-sm text-red-600">{openError}</p>
        )}
      </div>

      {claimResult && (
        <ChestOpeningModal
          item={claimResult.item}
          scrapped={claimResult.scrapped}
          scrappedXp={claimResult.scrappedXp}
          isEgg={claimResult.isEgg}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
