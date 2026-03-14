"use client";

import { useMissions } from "@/hooks/useMissions";
import { useUser } from "@/hooks/useUser";
import MissionPanel from "./MissionPanel";
import StreakDisplay from "./StreakDisplay";
import XPBar from "./XPBar";
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
    <div className="space-y-4">
      {/* XP */}
      {profile && !profileLoading && (
        <XPBar xp={profile.xp} level={profile.level} />
      )}

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
