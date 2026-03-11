import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Buscar perfil de public.users (dados do aluno)
  let profile: {
    display_name: string | null;
    level: number;
    role: string;
  } | null = null;
  let title: string = "Aprendiz";

  if (user) {
    const { data } = await supabase
      .from("users")
      .select("display_name, level, role")
      .eq("id", user.id)
      .single();
    profile = data;

    const { data: titleData } = await supabase
      .from("user_titles")
      .select("current_title")
      .eq("user_id", user.id)
      .single();
    if (titleData?.current_title) {
      title = titleData.current_title;
    }
  }

  const displayName = profile?.display_name || user?.email || "Usuário";
  const level = profile?.level ?? 1;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="overflow-x-hidden">
      {user && (
        <nav className="border-b bg-zinc-50">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-1 px-4 py-2">
            <div className="flex min-w-0 items-center gap-3">
              {/* Avatar placeholder */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 text-sm">
                <span className="block max-w-30 truncate font-medium sm:max-w-none">
                  {displayName}
                </span>
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium">
                  Nv. {level}
                </span>
                <span className="ml-1 text-xs text-zinc-500">
                  {title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/aulas"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Aulas
              </Link>
              <Link
                href="/puzzles"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Puzzles
              </Link>
              <Link
                href="/bots"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Bots
              </Link>
              <Link
                href="/configuracoes"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Config
              </Link>
              <form action="/auth/signout" method="post">
                <button className="rounded-md border bg-white px-3 py-1.5 text-xs hover:bg-zinc-100">
                  Sair
                </button>
              </form>
            </div>
          </div>
        </nav>
      )}
      {children}
    </div>
  );
}
