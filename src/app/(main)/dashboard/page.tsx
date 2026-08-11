import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DailyPanel from "@/components/gamification/DailyPanel";
import TaskPanel from "@/components/gamification/TaskPanel";
import FaixaDeComando from "@/components/layout/FaixaDeComando";
import Card, { CardTitle } from "@/components/ui/Card";
import { xpForLevel } from "@/lib/gamification/xp";

const ATALHOS = [
  { href: "/aulas", titulo: "Continuar Treinamento" },
  { href: "/puzzles/rating", titulo: "Desafio Tático" },
  { href: "/bots", titulo: "Enfrentar Bot" },
] as const;

interface RankingEntry {
  user_id: string;
  public_name: string;
  level: number;
  metric_value: number;
  title: string;
  position: number;
}

interface RankingResponse {
  entries: RankingEntry[];
  my_rank: RankingEntry | null;
  is_hidden: boolean;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  // Avatar + XP na mesma ida: o XP subiu para a faixa de comando, e buscá-lo
  // aqui evita o segundo round-trip que o XPBar fazia pelo useUser no client.
  //
  // AS TRÊS SAEM JUNTAS, e não em fila. Nenhuma depende do resultado da outra —
  // todas precisam só de `data.user.id`, que já existe desde a linha acima.
  // Enfileiradas eram três idas ao banco esperando uma à outra; ver T10 em
  // docs/achados.md. O `redirect` de avatar continua DEPOIS: quem cai nele é o
  // aluno de primeira visita, e pagar o ranking nesse caso é mais barato do que
  // segurar as outras duas esperando a resposta do perfil.
  const [
    { data: perfil },
    { data: titleData },
    { data: ranking, error: rankingError },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("avatar_chosen, xp, level, display_name, name")
      .eq("id", data.user.id)
      .single(),
    supabase
      .from("user_titles")
      .select("current_title")
      .eq("user_id", data.user.id)
      .single(),
    // Ranking top 5 para preview (nomes já mascarados pela RPC)
    supabase.rpc("get_ranking_with_position", { p_type: "rating", p_limit: 5 }),
  ]);

  if (perfil && !perfil.avatar_chosen) {
    redirect("/criar-personagem");
  }

  const primeiroNome = (perfil?.display_name ?? perfil?.name ?? "")
    .trim()
    .split(" ")[0];

  const title = titleData?.current_title ?? "Aprendiz";

  const response = ranking as RankingResponse | null;
  const entries: RankingEntry[] = response?.entries ?? [];

  return (
    <div className="min-h-full bg-warm-ivory pb-10 text-ink">
      <FaixaDeComando
        supertitulo="Reino das 64 Casas"
        titulo="Quartel-General"
        saudacao={primeiroNome ? `Bom te ver de volta, ${primeiroNome}.` : undefined}
        patente={title}
        xp={perfil?.xp}
        xpTotal={perfil ? xpForLevel(perfil.level) : undefined}
      />

      <div className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
        {/* Atalhos — a barra de ênfase marca o primeiro; ver comp em VariantA */}
        <nav className="space-y-2.5">
          {ATALHOS.map((a, i) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-ink/10 bg-white px-4 py-3 text-left transition-colors hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory"
            >
              <span
                aria-hidden
                className={`h-8 w-0.75 rounded-full ${i === 0 ? "bg-gold" : "bg-deep-navy/25"}`}
              />
              <span className="flex-1 text-sm font-semibold">{a.titulo}</span>
              <span aria-hidden className="text-ink/30">
                &rarr;
              </span>
            </Link>
          ))}
        </nav>

        {/* Blocos client-side: missões, streak, baús, insígnias */}
        <DailyPanel title={title} level={perfil?.level ?? 1} />

        {/* Tarefas da companhia (só aparece se aluno tem tarefas) */}
        <TaskPanel />

        {/* Quadro de Honra — preview top 5 */}
        <Card>
          <div className="mb-3 flex items-baseline justify-between">
            <CardTitle className="mb-0">Quadro de Honra</CardTitle>
            <Link
              href="/ranking"
              className="rounded text-xs font-medium text-ink/60 underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Ver completo &rarr;
            </Link>
          </div>

          {rankingError ? (
            <p className="text-sm text-erro">Erro ao carregar ranking.</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-ink/55">Nenhum jogador no ranking ainda.</p>
          ) : (
            <ol className="space-y-2">
              {entries.map((entry) => (
                <li
                  key={entry.user_id}
                  className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm ${
                    entry.user_id === data.user!.id
                      ? "bg-gold/12 font-medium ring-1 ring-gold/40"
                      : ""
                  }`}
                >
                  {/* Medalha no top 3 — forma além da cor. Do 4º em diante, o
                      número em Inter: Cinzel some em corpo pequeno. */}
                  <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-ink/70">
                    {entry.position <= 3
                      ? MEDAL[entry.position - 1]
                      : entry.position}
                  </span>
                  <Link
                    href={`/perfil/${entry.user_id}`}
                    className="flex-1 truncate rounded underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    {entry.public_name}
                  </Link>
                  <span className="text-xs text-ink/70">
                    {entry.title ?? "Aprendiz"}
                  </span>
                  <span className="w-11 shrink-0 text-right text-xs font-semibold tabular-nums">
                    {entry.metric_value}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
