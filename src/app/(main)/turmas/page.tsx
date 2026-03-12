import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TurmasClient from "./TurmasClient";

export default async function TurmasPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role ?? "aluno";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold">Companhias</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {role === "professor"
            ? "Gerencie suas companhias e acompanhe seus alunos."
            : "Suas companhias de treinamento."}
        </p>
      </div>

      <TurmasClient role={role} />
    </div>
  );
}
