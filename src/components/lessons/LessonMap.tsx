"use client";

import Link from "next/link";
import FaixaDeComando from "@/components/layout/FaixaDeComando";
import type { LessonMapEntry, ReviewGateEntry } from "@/types/lesson";
import { TRAILS } from "@/types/lesson";

interface LessonMapProps {
  lessons: LessonMapEntry[];
  reviewGates: ReviewGateEntry[];
  /**
   * Que TÍTULO cada trilha concede quando fecha, por `lessons.trail`. Vem de
   * `title_tiers` no servidor — não de uma cópia em TS.
   *
   * Existe porque a trilha se chama pelo título que o aluno carrega ENQUANTO a
   * cursa (Bíblia §6), o que é coerente e, sozinho, esconde o prêmio: quem está
   * na trilha "Calouro" não tem como saber que ela entrega "Aprendiz". A regra
   * não muda; a tela passa a dizer o destino.
   */
  tituloPorTrilha?: ReadonlyMap<string, string>;
}

function StarDisplay({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 text-xs">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= count ? "text-gold" : "text-ink/20"}>
          ★
        </span>
      ))}
    </div>
  );
}

function LessonBubble({ lesson }: { lesson: LessonMapEntry }) {
  const isClickable =
    lesson.status === "available" ||
    lesson.status === "in_progress" ||
    lesson.status === "completed";

  const bubble = (
    <div
      className={`
        flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 transition-all
        ${lesson.status === "locked"
          ? "cursor-not-allowed border-ink/15 bg-ink/4 opacity-60"
          : lesson.status === "available"
            ? "cursor-pointer border-ok/50 bg-white hover:border-ok"
            : lesson.status === "in_progress"
              ? "cursor-pointer border-gold bg-gold/10 hover:border-gold"
              : "cursor-pointer border-ok/30 bg-ok/8 hover:border-ok/60"
        }
      `}
    >
      {lesson.status === "locked" && (
        <svg className="h-6 w-6 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )}
      {lesson.status === "available" && (
        <svg className="h-6 w-6 text-ok" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
      {lesson.status === "in_progress" && (
        <div className="relative flex items-center justify-center">
          <svg className="h-8 w-8" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor" className="text-ink/15"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor" className="text-gold"
              strokeWidth="3"
              strokeDasharray={`${(lesson.steps_completed / lesson.total_steps) * 100}, 100`}
            />
          </svg>
          <span className="absolute text-xs font-bold text-ink">
            {lesson.steps_completed}/{lesson.total_steps}
          </span>
        </div>
      )}
      {lesson.status === "completed" && (
        <>
          <svg className="h-5 w-5 text-ok" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <StarDisplay count={lesson.stars} />
        </>
      )}
    </div>
  );

  if (isClickable) {
    return (
      <Link href={`/aulas/${lesson.id}`} className="flex flex-col items-center gap-1">
        {bubble}
        <span className="max-w-20 truncate text-center text-xs text-ink/70">
          {lesson.trail_order}. {lesson.title}
        </span>
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1" title="Complete a aula anterior">
      {bubble}
      <span className="max-w-20 truncate text-center text-xs text-ink/45">
        {lesson.trail_order}. {lesson.title}
      </span>
    </div>
  );
}

function ReviewGateBubble({
  trail,
  gate,
  allComplete,
}: {
  trail: string;
  gate: ReviewGateEntry | undefined;
  allComplete: boolean;
}) {
  const passed = gate?.passed ?? false;
  const isAvailable = allComplete && !passed;

  const bubble = (
    <div
      className={`
        flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 transition-all
        ${passed
          ? "cursor-pointer border-gold bg-gold/15"
          : isAvailable
            ? "cursor-pointer border-gold bg-white hover:bg-gold/10"
            : "cursor-not-allowed border-ink/15 bg-ink/4 opacity-60"
        }
      `}
    >
      <svg className={`h-7 w-7 ${passed ? "text-gold" : isAvailable ? "text-gold" : "text-ink/40"}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {passed && (
        <span className="text-xs font-bold text-ink">
          {gate?.best_score}/10
        </span>
      )}
    </div>
  );

  if (isAvailable || passed) {
    return (
      <Link href={`/aulas/review/${trail}`} className="flex flex-col items-center gap-1">
        {bubble}
        <span className="text-center text-xs text-ink/70">Desafio Final</span>
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1" title="Complete todas as aulas da trilha">
      {bubble}
      <span className="text-center text-xs text-ink/45">Desafio Final</span>
    </div>
  );
}

export default function LessonMap({ lessons, reviewGates, tituloPorTrilha }: LessonMapProps) {
  return (
    <div className="min-h-full bg-warm-ivory pb-10 text-ink">
      {/* "Aulas" violava o vocabulário oficial da Bíblia Tonal §8. */}
      <FaixaDeComando
        supertitulo="Academia 64"
        titulo="Trilhas"
        saudacao="Sua formação, trilha a trilha."
      />

      <div className="mx-auto max-w-2xl space-y-8 px-4 pt-6">

      {TRAILS.map((trail) => {
        const trailLessons = lessons.filter((l) => l.trail === trail.key);
        if (trailLessons.length === 0) return null;

        const gate = reviewGates.find((g) => g.trail === trail.key);
        const allComplete = trailLessons.every((l) => l.status === "completed");
        const isTrailLocked = trailLessons.every((l) => l.status === "locked");

        return (
          <div key={trail.key} className={isTrailLocked ? "opacity-60" : ""}>
            <div className="mb-4 flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: trail.color }}
              />
              <div>
                <h2 className="font-heading text-lg font-bold">
                  {trail.name}
                </h2>
                <p className="text-sm text-ink/55">{trail.description}</p>
                {/*
                  O DESTINO da trilha — a formatura do semestre, nomeada.
                  Sem esta linha a tela só diz onde o aluno ESTÁ; o prêmio de
                  concluir 15 aulas ficava invisível até a hora em que caía.
                  Quando a trilha já fechou, o verbo muda: vira registro do que
                  foi conquistado, não promessa repetida.
                */}
                {tituloPorTrilha?.get(trail.key) && (
                  <p className="mt-0.5 text-xs font-medium text-ink/70">
                    {allComplete
                      ? `Trilha concluída — título de ${tituloPorTrilha.get(trail.key)} conquistado.`
                      : `Conclua esta trilha para se tornar ${tituloPorTrilha.get(trail.key)}.`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {trailLessons.map((lesson) => (
                <LessonBubble key={lesson.id} lesson={lesson} />
              ))}
              <ReviewGateBubble
                trail={trail.key}
                gate={gate}
                allComplete={allComplete}
              />
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
