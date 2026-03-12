import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AlunoRelatorioClient from "./AlunoRelatorioClient";

interface AlunoRelatorioPageProps {
  params: Promise<{ id: string; userId: string }>;
}

export default async function AlunoRelatorioPage({ params }: AlunoRelatorioPageProps) {
  const { id, userId } = await params;
  const classId = Number(id);

  if (!classId || isNaN(classId)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  // Guard: só professor da turma
  const { data: cls } = await supabase
    .from("classes")
    .select("id, teacher_id, name")
    .eq("id", classId)
    .single();

  if (!cls || cls.teacher_id !== data.user.id) notFound();

  // Verificar que userId é membro da turma
  const { data: membership } = await supabase
    .from("class_members")
    .select("id")
    .eq("class_id", classId)
    .eq("user_id", userId)
    .single();

  if (!membership) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <AlunoRelatorioClient classId={classId} className={cls.name} studentId={userId} />
    </div>
  );
}
