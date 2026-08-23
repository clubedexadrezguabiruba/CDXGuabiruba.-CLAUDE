"use client";

import Link from "next/link";
import { useClassFeed } from "@/hooks/useClassFeed";
import { AvatarCabeca } from "@/components/avatar/AvatarCabeca";
import MolduraPatente from "@/components/avatar/MolduraPatente";
import type { FeedEvent, FeedEventType } from "@/types/class";

interface MuralClientProps {
  classId: number;
  className: string;
}

const EVENT_CONFIG: Record<FeedEventType, { icon: string; label: string; color: string }> = {
  bot_defeated: { icon: "\u{1F916}", label: "derrotou um bot", color: "bg-red-50 text-red-800" },
  level_up: { icon: "\u{2B50}", label: "subiu de nivel", color: "bg-amber-50 text-amber-800" },
  rating_milestone: { icon: "\u{1F4C8}", label: "novo marco de rating", color: "bg-blue-50 text-blue-800" },
  title_earned: { icon: "\u{1F396}\uFE0F", label: "conquistou um titulo", color: "bg-purple-50 text-purple-800" },
  streak_milestone: { icon: "\u{1F525}", label: "marco de sequencia", color: "bg-orange-50 text-orange-800" },
  rush_record: { icon: "\u{26A1}", label: "novo recorde no rush", color: "bg-yellow-50 text-yellow-800" },
  achievement_unlocked: { icon: "\u{1F3C6}", label: "desbloqueou uma conquista", color: "bg-emerald-50 text-emerald-800" },
};

function formatEvent(event: FeedEvent): string {
  const d = event.event_data;
  const name = event.display_name ?? "Jogador";

  switch (event.event_type) {
    case "bot_defeated":
      return `${name} derrotou ${(d.bot_name as string) ?? "um bot"}!`;
    case "level_up":
      return `${name} alcancou o nivel ${(d.new_level as number) ?? "?"}!`;
    case "rating_milestone":
      return `${name} atingiu ${(d.rating as number) ?? "?"} de rating!`;
    case "title_earned":
      return `${name} conquistou o titulo "${(d.title as string) ?? "?"}"!`;
    case "streak_milestone":
      return `${name} completou ${(d.streak as number) ?? "?"} dias consecutivos!`;
    case "rush_record":
      return `${name} fez ${(d.score as number) ?? "?"} pontos no rush ${(d.mode as string) ?? ""}!`;
    case "achievement_unlocked":
      return `${name} desbloqueou "${(d.title as string) ?? (d.achievement_key as string) ?? "conquista"}"!`;
    default:
      return `${name} fez algo incrivel!`;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function MuralClient({ classId, className }: MuralClientProps) {
  const { events, loading, error, refresh } = useClassFeed(classId);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        Carregando mural...
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
      {/* Header */}
      <div className="mb-4 rounded-xl border bg-white p-5 shadow-sm">
        <Link href={`/turmas/${classId}`} className="text-xs text-zinc-400 hover:text-zinc-600">
          &larr; {className}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">Mural da Turma</h1>
        <p className="mt-0.5 text-xs text-zinc-500">Conquistas recentes dos membros.</p>
      </div>

      {/* Refresh */}
      <button
        onClick={refresh}
        className="mb-4 w-full rounded-xl border bg-white py-2.5 text-sm font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
      >
        Atualizar
      </button>

      {/* Feed */}
      {events.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-zinc-500">
            Nenhum evento no mural ainda. As conquistas dos membros aparecerao aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.achievement_unlocked;

            return (
              <div
                key={event.id}
                className={`rounded-xl border p-4 shadow-sm ${config.color}`}
              >
                <div className="flex items-start gap-3">
                  {/* O emoji diz O QUE houve; o boneco diz QUEM foi. Os dois
                      juntos, e nenhum no lugar do outro — trocar o emoji pelo
                      avatar apagaria o tipo do evento, que é a única coisa que a
                      cor do cartão também carrega (e cor sozinha não basta). */}
                  <span className="text-2xl" aria-hidden>
                    {config.icon}
                  </span>
                  <MolduraPatente tier={event.achieved_tier}>
                    <AvatarCabeca
                      skin={event.avatar_skin}
                      hair={event.avatar_cabelo}
                      hairColor={event.avatar_hair_color}
                      chapeu={event.avatar_chapeu}
                      rosto={event.avatar_rosto}
                      lado={32}
                      ns={`mu-${event.id}`}
                    />
                  </MolduraPatente>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{formatEvent(event)}</p>
                    <p className="mt-0.5 text-xs opacity-60">
                      {timeAgo(event.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
