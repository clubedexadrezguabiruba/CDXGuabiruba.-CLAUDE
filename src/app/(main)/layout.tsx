import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

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
        <nav className="border-b border-ink/10 bg-warm-ivory">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-1 px-4 py-2">
            <div className="flex min-w-0 items-center gap-3">
              {/* Avatar placeholder */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-deep-navy text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 text-sm">
                <span className="block max-w-30 truncate font-medium sm:max-w-none">
                  {displayName}
                </span>
                <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-medium">
                  Nv. {level}
                </span>
                <span className="ml-1 text-xs text-ink/55">
                  {title}
                </span>
              </div>
            </div>

            {/* flex-wrap aqui, e não só no pai: sem ele os 7 links + Sair
                somam 451px numa tela de 375, e "Config" e "Sair" ficam FORA
                da tela — inacessíveis. O overflow-x-hidden do wrapper
                escondia o sintoma, então nenhum gate pegava. Medido no
                navegador, não deduzido. A barra inferior fixa que o DESIGN.md
                descreve resolve isso de vez; até lá, quebrar é o mínimo. */}
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
              <Link
                href="/aulas"
                className="rounded text-sm font-medium text-ink/70 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory"
              >
                Trilhas
              </Link>
              <Link
                href="/puzzles"
                className="rounded text-sm font-medium text-ink/70 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory"
              >
                Desafios
              </Link>
              <Link
                href="/bots"
                className="rounded text-sm font-medium text-ink/70 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory"
              >
                Bots
              </Link>
              <Link
                href="/turmas"
                className="rounded text-sm font-medium text-ink/70 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory"
              >
                Turmas
              </Link>
              <Link
                href="/ranking"
                className="rounded text-sm font-medium text-ink/70 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory"
              >
                Honra
              </Link>
              <Link
                href="/perfil"
                className="rounded text-sm font-medium text-ink/70 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory"
              >
                Perfil
              </Link>
              <Link
                href="/configuracoes"
                className="rounded text-sm font-medium text-ink/70 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory"
              >
                Config
              </Link>
              <form action="/auth/signout" method="post">
                <button className={buttonVariants("ghost", "min-h-9 px-3 text-xs")}>
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
