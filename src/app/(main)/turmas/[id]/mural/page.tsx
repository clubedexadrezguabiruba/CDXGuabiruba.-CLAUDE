import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MuralClient from "./MuralClient";

interface MuralPageProps {
  params: Promise<{ id: string }>;
}

export default async function MuralPage({ params }: MuralPageProps) {
  const { id } = await params;
  const classId = Number(id);

  if (!classId || isNaN(classId)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  // Guard: RLS filtra — professor ou membro
  const { data: cls } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", classId)
    .single();

  if (!cls) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <MuralClient classId={classId} className={cls.name} />
    </div>
  );
}
