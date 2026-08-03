"use client";

import { useMissions } from "@/hooks/useMissions";
import { useUser } from "@/hooks/useUser";
import MissionPanel from "./MissionPanel";
import StreakDisplay from "./StreakDisplay";
import AchievementPanel from "./AchievementPanel";
import ChestPanel from "./ChestPanel";
import EggCard from "./EggCard";
import ActivityToasts from "./ActivityToasts";

export default function DailyPanel({ title }: { title: string }) {
  const {
    missions,
    allCompleted,
    chestAvailable,
    streak,
    newAchievements,
    loading,
    error,
  } = useMissions();
  const { profile, loading: profileLoading } = useUser();

  return (
    <div className="space-y-5">
      {/* O XP subiu para a FaixaDeComando — o comp da direção A o põe lá, e
          manter o card aqui deixaria duas barras de XP na mesma tela. */}

      {/* Ordens do Dia */}
      <MissionPanel
        missions={missions}
        allCompleted={allCompleted}
        chestAvailable={chestAvailable}
        loading={loading}
        error={error}
        title={title}
      />

      {/* Sequência de Campanha */}
      <StreakDisplay streak={streak} loading={loading} />

      {/* Baús */}
      <ChestPanel />

      {/* Chocadeira */}
      <EggCard />

      {/* Insígnias */}
      <AchievementPanel />

      {/* Toasts unificados (fila sequencial) */}
      {profile && !profileLoading && (
        <ActivityToasts
          preloadedData={{
            missions,
            newAchievements,
            level: profile.level,
          }}
        />
      )}
    </div>
  );
}
