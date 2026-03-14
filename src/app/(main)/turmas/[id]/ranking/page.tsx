import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClassRankingClient from "./ClassRankingClient";
import type { RankingEntry } from "@/types/ranking";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClassRankingPage({ params }: Props) {
  const { id } = await params;
  const classId = Number(id);

  if (!classId || isNaN(classId)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  // Buscar nome da turma
  const { data: cls } = await supabase
    .from("classes")
    .select("name")
    .eq("id", classId)
    .single();

  if (!cls) notFound();

  // Fetch inicial: rating top 30
  const { data: ranking, error } = await supabase.rpc("get_class_ranking", {
    p_class_id: classId,
    p_type: "rating",
    p_limit: 30,
  });

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-xl border bg-red-50 p-4 text-sm text-red-600">
          {error.message.includes("Sem permissão")
            ? "Você não tem acesso ao ranking desta companhia."
            : "Erro ao carregar ranking."}
        </div>
      </div>
    );
  }

  const entries: RankingEntry[] = (ranking as RankingEntry[] | null) ?? [];

  return (
    <ClassRankingClient
      classId={classId}
      className={cls.name}
      initialEntries={entries}
      userId={data.user.id}
    />
  );
}
