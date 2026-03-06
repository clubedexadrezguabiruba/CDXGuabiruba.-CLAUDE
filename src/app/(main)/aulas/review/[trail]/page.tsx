import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { LessonExerciseSection } from "@/types/lesson";
import { TRAILS } from "@/types/lesson";
import ReviewGate from "@/components/lessons/ReviewGate";
import type { ReviewExercise } from "@/components/lessons/ReviewGate";

/** Fisher-Yates shuffle — extracted to avoid lint purity complaint in render */
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface PageProps {
  params: Promise<{ trail: string }>;
}

export default async function ReviewGatePage({ params }: PageProps) {
  const { trail } = await params;

  // Validate trail
  const trailConfig = TRAILS.find((t) => t.key === trail);
  if (!trailConfig) redirect("/aulas");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check all trail lessons are completed
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, content_json, total_steps")
    .eq("trail", trail)
    .order("trail_order");

  if (!lessons || lessons.length === 0) redirect("/aulas");

  const { data: progressData } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id, completed")
    .eq("user_id", user.id)
    .in(
      "lesson_id",
      lessons.map((l) => l.id)
    );

  const completedSet = new Set(
    (progressData ?? [])
      .filter((p) => p.completed)
      .map((p) => p.lesson_id)
  );

  const allComplete = lessons.every((l) => completedSet.has(l.id));

  if (!allComplete) redirect("/aulas");

  // Extract all exercises from all trail lessons
  const allExercises: ReviewExercise[] = [];

  for (const lesson of lessons) {
    const content = lesson.content_json as { sections: { type: string }[] };
    let stepIndex = 0;
    for (const section of content.sections) {
      if (section.type === "exercise") {
        stepIndex++;
        allExercises.push({
          lessonId: lesson.id,
          stepIndex,
          exercise: section as unknown as LessonExerciseSection,
        });
      }
    }
  }

  // Randomly pick 10 exercises (server-side shuffle)
  const selected = shuffleArray(allExercises).slice(0, 10);

  return (
    <ReviewGate
      trail={trail}
      trailName={trailConfig.name}
      exercises={selected}
    />
  );
}
