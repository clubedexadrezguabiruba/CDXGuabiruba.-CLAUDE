import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TurmaDetailClient from "./TurmaDetailClient";

interface TurmaPageProps {
  params: Promise<{ id: string }>;
}

export default async function TurmaPage({ params }: TurmaPageProps) {
  const { id } = await params;
  const classId = Number(id);

  if (!classId || isNaN(classId)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  // Server-side guard: RLS garante que só professor da turma ou membro vê
  const { data: cls } = await supabase
    .from("classes")
    .select("id, teacher_id, name, invite_code, active, created_at")
    .eq("id", classId)
    .single();

  if (!cls) notFound();

  const isTeacher = cls.teacher_id === data.user.id;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <TurmaDetailClient classId={classId} isTeacher={isTeacher} />
    </div>
  );
}
