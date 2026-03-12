import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TarefasClient from "./TarefasClient";

interface TarefasPageProps {
  params: Promise<{ id: string }>;
}

export default async function TarefasPage({ params }: TarefasPageProps) {
  const { id } = await params;
  const classId = Number(id);

  if (!classId || isNaN(classId)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  // Apenas professor da turma acessa
  const { data: cls } = await supabase
    .from("classes")
    .select("id, teacher_id, name")
    .eq("id", classId)
    .single();

  if (!cls || cls.teacher_id !== data.user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <TarefasClient classId={classId} className={cls.name} />
    </div>
  );
}
