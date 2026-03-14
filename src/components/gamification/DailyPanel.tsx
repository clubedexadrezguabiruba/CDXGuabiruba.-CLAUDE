"use client";

import { useMissions } from "@/hooks/useMissions";
import { useUser } from "@/hooks/useUser";
import MissionPanel from "./MissionPanel";
import StreakDisplay from "./StreakDisplay";
import XPBar from "./XPBar";
import LevelUpToast from "./LevelUpToast";
import AchievementPanel from "./AchievementPanel";
import AchievementToast from "./AchievementToast";
import MissionCompletionToast from "./MissionCompletionToast";
import ChestPanel from "./ChestPanel";

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
      {/* XP e Level-up */}
      {profile && !profileLoading && (
        <>
          <XPBar xp={profile.xp} level={profile.level} />
          <LevelUpToast level={profile.level} />
        </>
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

      {/* Insígnias */}
      <AchievementPanel />

      {/* Toasts */}
      <MissionCompletionToast missions={missions} />
      <AchievementToast achievements={newAchievements} />
    </div>
  );
}
