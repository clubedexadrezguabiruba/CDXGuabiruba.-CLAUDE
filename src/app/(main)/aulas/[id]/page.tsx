import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeUnlockStatus } from "@/lib/lessons/unlockLogic";
import type { RawLessonMapRow } from "@/lib/lessons/unlockLogic";
import type { LessonRow, ReviewGateEntry } from "@/types/lesson";
import LessonViewer from "@/components/lessons/LessonViewer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AulaPage({ params }: PageProps) {
  const { id } = await params;
  const lessonId = Number(id);

  if (isNaN(lessonId)) redirect("/aulas");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch lesson
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (lessonError || !lesson) redirect("/aulas");

  // Fetch progress
  const { data: progressData } = await supabase
    .from("user_lesson_progress")
    .select("steps_completed, completed, stars")
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .single();

  // Check if lesson is unlocked via lesson map
  const { data: mapData } = await supabase.rpc("get_lesson_map");
  const rawLessons: RawLessonMapRow[] = mapData?.lessons ?? [];
  const rawGates: ReviewGateEntry[] = (mapData?.review_gates ?? []).map(
    (g: { trail: string; passed: boolean; best_score: number }) => ({
      trail: g.trail,
      passed: g.passed,
      required: true,
      best_score: g.best_score,
    })
  );

  const entries = computeUnlockStatus(rawLessons, rawGates);
  const entry = entries.find((e) => e.id === lessonId);

  if (!entry || entry.status === "locked") redirect("/aulas");

  return (
    <LessonViewer
      lesson={lesson as unknown as LessonRow}
      initialProgress={
        progressData
          ? {
              steps_completed: progressData.steps_completed,
              completed: progressData.completed,
              stars: progressData.stars ?? 0,
            }
          : null
      }
    />
  );
}
