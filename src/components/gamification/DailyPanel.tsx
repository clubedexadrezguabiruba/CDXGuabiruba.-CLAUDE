"use client";

import { useMissions } from "@/hooks/useMissions";
import MissionPanel from "./MissionPanel";
import StreakDisplay from "./StreakDisplay";
import AchievementPanel from "./AchievementPanel";
import ChestPanel from "./ChestPanel";
import EggCard from "./EggCard";
import ActivityToasts from "./ActivityToasts";

/**
 * O `level` DESCE DO SERVIDOR, e não sai mais de um `useUser()` aqui.
 *
 * O painel usava uma única coisa do perfil — `profile.level`, para armar a
 * linha de base do toast de nível. Buscá-lo no cliente custava duas idas em
 * fila (`auth.getUser()` é rede, não leitura local; só depois vinha o `SELECT`
 * de 20 colunas em `users`), para achar um número que a página do dashboard já
 * tinha lido no servidor. Ver D10 em docs/achados.md.
 */
export default function DailyPanel({
  title,
  level,
}: {
  title: string;
  level: number;
}) {
  const {
    missions,
    allCompleted,
    chestAvailable,
    streak,
    newAchievements,
    loading,
    error,
  } = useMissions();

  return (
    <div className="space-y-5">
      {/* O XP subiu para a FaixaDeComando — o comp da direção A o põe lá, e
          manter o card aqui deixaria duas barras de XP na mesma tela. */}

      {/* Missões do Dia */}
      <MissionPanel
        missions={missions}
        allCompleted={allCompleted}
        chestAvailable={chestAvailable}
        loading={loading}
        error={error}
        title={title}
      />

      {/* Sequência de Presença */}
      <StreakDisplay streak={streak} loading={loading} />

      {/* Baús */}
      <ChestPanel />

      {/* Chocadeira */}
      <EggCard />

      {/* Insígnias */}
      <AchievementPanel />

      {/* Toasts unificados (fila sequencial).
          A trava é `!loading` do useMissions, e ISSO IMPORTA. O
          `<ActivityToasts>` silencia no primeiro mount as missões que já estão
          completas (`preloadedData.missions`, ActivityToasts.tsx:88-91) — se
          montar antes de as missões chegarem, a lista está vazia, nada é
          silenciado, e missão velha volta a pipocar toda vez que o aluno abre o
          dashboard. Antes quem segurava era o `profileLoading` do useUser, por
          acidente: ele demorava o bastante. Agora a trava é a condição de
          verdade. */}
      {!loading && (
        <ActivityToasts
          preloadedData={{
            missions,
            newAchievements,
            level,
          }}
        />
      )}
    </div>
  );
}
