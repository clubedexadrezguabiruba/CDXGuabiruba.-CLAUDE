import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PUZZLE_THEMES } from "@/lib/chess/themeMap";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-2">
        <Link
          href="/puzzles"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Puzzles
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Categorias</h1>
      <p className="text-sm text-zinc-500">
        Pratique temas táticos específicos. Categorias não alteram seu rating.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {PUZZLE_THEMES.map((theme) => (
          <Link
            key={theme.key}
            href={`/puzzles/categorias/${theme.key}`}
            className="flex flex-col gap-1 rounded-xl border bg-white p-4 transition-colors hover:bg-zinc-50"
          >
            <h3 className="font-semibold">{theme.name}</h3>
            <p className="text-xs text-zinc-500">{theme.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
