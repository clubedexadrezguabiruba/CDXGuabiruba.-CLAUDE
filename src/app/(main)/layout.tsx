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

  if (user) {
    const { data } = await supabase
      .from("users")
      .select("display_name, level, role")
      .eq("id", user.id)
      .single();
    profile = data;
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
    <div>
      {user && (
        <nav className="border-b bg-zinc-50">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              {/* Avatar placeholder */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="text-sm">
                <span className="font-medium">{displayName}</span>
                <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium">
                  Nv. {level}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
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
