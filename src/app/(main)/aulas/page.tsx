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

  const { data, error } = await supabase.rpc("get_lesson_map");

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

  return <LessonMap lessons={lessons} reviewGates={rawGates} />;
}
