"use client";
import Card, { CardTitle } from "@/components/ui/Card";

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
      <Card>
        <CardTitle>Baús</CardTitle>
        <div className="flex items-center justify-center py-4 text-sm text-ink/45">
          Carregando...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardTitle>Baús</CardTitle>
        <p className="text-sm text-erro">Erro: {error}</p>
      </Card>
    );
  }

  const visibleChests = expanded ? chests : chests.slice(0, VISIBLE_LIMIT);
  const hiddenCount = chests.length - VISIBLE_LIMIT;

  return (
    <>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <CardTitle className="mb-0">Baús</CardTitle>
          {chests.length > 0 && (
            <span className="text-sm font-medium text-ink/55">
              {chests.length} pendente{chests.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {chests.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink/45">
            Nenhum baú pendente.
          </p>
        ) : (
          <div className="space-y-2">
            {visibleChests.map((chest) => (
              <div
                key={chest.id}
                className="flex items-center justify-between rounded-lg border border-ink/10 bg-white p-3 shadow-sm transition-all hover:shadow"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <span className="text-sm font-medium">Baú</span>
                    <span className="ml-1.5 text-xs text-ink/45">
                      {SOURCE_LABELS[chest.source_type] ?? chest.source_type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpen(chest)}
                  disabled={opening !== null}
                  className="rounded-lg bg-gold px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gold disabled:opacity-50"
                >
                  {opening === chest.id ? "Abrindo..." : "Abrir"}
                </button>
              </div>
            ))}

            {!expanded && hiddenCount > 0 && (
              <button
                onClick={() => setExpanded(true)}
                className="w-full rounded-lg border border-dashed border-ink/15 py-2 text-sm font-medium text-ink/55 transition-colors hover:border-ink/25 hover:text-ink/80"
              >
                Ver mais {hiddenCount} {hiddenCount === 1 ? "baú" : "baús"}
              </button>
            )}
          </div>
        )}

        {openError && (
          <p className="mt-2 text-sm text-erro">{openError}</p>
        )}
      </Card>

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
