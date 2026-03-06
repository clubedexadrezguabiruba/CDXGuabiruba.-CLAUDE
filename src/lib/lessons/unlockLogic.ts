import type {
  LessonMapEntry,
  LessonStatus,
  ReviewGateEntry,
} from "@/types/lesson";

// =============================================
// Lógica de desbloqueio de aulas (Phase 5)
// Função pura — sem dependências externas
// =============================================

/** Dados brutos retornados pela RPC get_lesson_map */
export interface RawLessonMapRow {
  id: number;
  title: string;
  trail: string;
  trail_order: number;
  total_steps: number;
  steps_completed: number;
  completed: boolean;
  stars: number;
}

/**
 * Calcula o status de desbloqueio de cada aula.
 *
 * Regras:
 * - Aula 1 da Recruta: sempre `available`
 * - Aula N: requer aula N-1 da mesma trilha `completed`
 * - Soldado: requer todas 15 da Recruta `completed` E Review Gate da Recruta `passed`
 * - Se tem steps_completed > 0 e não completed → `in_progress`
 */
export function computeUnlockStatus(
  rawLessons: RawLessonMapRow[],
  reviewGates: ReviewGateEntry[]
): LessonMapEntry[] {
  // Indexar review gates por trilha
  const gateMap = new Map<string, ReviewGateEntry>();
  for (const gate of reviewGates) {
    gateMap.set(gate.trail, gate);
  }

  // Agrupar aulas por trilha, ordenadas por trail_order
  const byTrail = new Map<string, RawLessonMapRow[]>();
  for (const lesson of rawLessons) {
    if (!byTrail.has(lesson.trail)) {
      byTrail.set(lesson.trail, []);
    }
    byTrail.get(lesson.trail)!.push(lesson);
  }
  for (const trail of byTrail.keys()) {
    byTrail.get(trail)!.sort((a, b) => a.trail_order - b.trail_order);
  }

  // Verificar se Recruta está toda completa + review gate passed
  const recrutaLessons = byTrail.get("recruta") ?? [];
  const recrutaAllCompleted =
    recrutaLessons.length > 0 &&
    recrutaLessons.every((l) => l.completed);
  const recrutaGatePassed = gateMap.get("recruta")?.passed ?? false;
  const soldadoUnlocked = recrutaAllCompleted && recrutaGatePassed;

  const result: LessonMapEntry[] = [];

  // Ordem de trilhas para processamento
  const trailOrder = ["recruta", "soldado"];

  for (const trail of trailOrder) {
    const lessons = byTrail.get(trail) ?? [];

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      let status: LessonStatus;

      if (lesson.completed) {
        status = "completed";
      } else if (trail === "recruta") {
        if (i === 0) {
          // Aula 1 da Recruta: sempre disponível
          status = lesson.steps_completed > 0 ? "in_progress" : "available";
        } else {
          // Requer aula anterior completa
          const prev = lessons[i - 1];
          if (prev.completed) {
            status = lesson.steps_completed > 0 ? "in_progress" : "available";
          } else {
            status = "locked";
          }
        }
      } else if (trail === "soldado") {
        if (!soldadoUnlocked) {
          status = "locked";
        } else if (i === 0) {
          // Aula 1 do Soldado: disponível se Soldado desbloqueado
          status = lesson.steps_completed > 0 ? "in_progress" : "available";
        } else {
          const prev = lessons[i - 1];
          if (prev.completed) {
            status = lesson.steps_completed > 0 ? "in_progress" : "available";
          } else {
            status = "locked";
          }
        }
      } else {
        // Trilhas futuras (aspirante, capitao, etc.) — locked por padrão
        status = "locked";
      }

      result.push({
        id: lesson.id,
        title: lesson.title,
        trail: lesson.trail,
        trail_order: lesson.trail_order,
        total_steps: lesson.total_steps,
        status,
        steps_completed: lesson.steps_completed,
        stars: lesson.stars,
      });
    }
  }

  return result;
}

/**
 * Calcula estrelas (1-3) baseado em erros e hints usados.
 *
 * - 3★: zero erros E zero hints → "Perfeita!"
 * - 2★: até 2 erros (com ou sem hints) → "Muito bem!"
 *   (Hint impede 3★ porque hintsUsed > 0 falha na condição de 3★)
 * - 1★: 3+ erros → "Completou!"
 */
export function calculateStars(
  errors: number,
  hintsUsed: number
): 1 | 2 | 3 {
  if (errors === 0 && hintsUsed === 0) return 3;
  if (errors <= 2) return 2;
  return 1;
}
