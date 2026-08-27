import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeUnlockStatus } from "@/lib/lessons/unlockLogic";
import type { RawLessonMapRow } from "@/lib/lessons/unlockLogic";
import type { ReviewGateEntry } from "@/types/lesson";
import LessonMap from "@/components/lessons/LessonMap";

export default async function AulasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // As duas saem juntas: o mapa de aulas não depende da escada de títulos, e a
  // escada é configuração global de 8 linhas.
  const [{ data, error }, { data: escada }] = await Promise.all([
    supabase.rpc("get_lesson_map"),
    supabase.from("title_tiers").select("title, trail"),
  ]);

  if (error) {
    console.error("[AulasPage] RPC error:", error);
    return (
      <div className="p-8 text-center text-red-600">
        Erro ao carregar aulas. Tente novamente.
      </div>
    );
  }

  const rawLessons: RawLessonMapRow[] = data?.lessons ?? [];
  const rawGates: ReviewGateEntry[] = (data?.review_gates ?? []).map(
    (g: { trail: string; passed: boolean; best_score: number }) => ({
      trail: g.trail,
      passed: g.passed,
      required: true,
      best_score: g.best_score,
    })
  );

  const lessons = computeUnlockStatus(rawLessons, rawGates);

  // Que título cada trilha entrega quando fecha. Vem de `title_tiers`, que é a
  // régua — a alternativa era uma tabela em TS, que é exatamente a divergência
  // que o gate (a2) do verify:avatar-db passou a impedir entre banco e código.
  const tituloPorTrilha = new Map<string, string>();
  for (const t of (escada ?? []) as { title: string; trail: string | null }[]) {
    if (t.trail) tituloPorTrilha.set(t.trail, t.title);
  }

  return (
    <LessonMap
      lessons={lessons}
      reviewGates={rawGates}
      tituloPorTrilha={tituloPorTrilha}
    />
  );
}
