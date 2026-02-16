import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="rounded-xl border p-4 text-sm">
        <div className="font-medium">Logado</div>
        <div className="mt-2 space-y-1 text-zinc-700">
          <div><span className="font-medium">User ID:</span> {data.user.id}</div>
          <div><span className="font-medium">Email:</span> {data.user.email}</div>
        </div>
      </div>

      <form action="/auth/signout" method="post">
        <button className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50">
          Sair
        </button>
      </form>
    </div>
  );
}
