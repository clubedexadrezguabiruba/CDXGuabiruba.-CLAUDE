import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { AvatarCabeca } from "@/components/avatar/AvatarCabeca";
import MolduraPatente from "@/components/avatar/MolduraPatente";

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
    avatar_skin: number;
    avatar_cabelo: string | null;
    avatar_hair_color: number;
    // As duas peças do recorte de cabeça (achado G22). A navbar é a única das cinco
    // telas que não passa por RPC de lista: ela lê `users` direto, então aqui a
    // chave não se perde num cast — ela nem sai do banco se faltar no SELECT.
    avatar_chapeu: string | null;
    avatar_rosto: string | null;
    avatar_chosen: boolean;
  } | null = null;
  let title: string = "Calouro";
  // O NÚMERO do título, para a moldura. 0 é Calouro, e é degrau real: quem não
  // tem linha em `user_titles` continua vendo um anel — o neutro, desenhado pela
  // <MolduraPatente>. Sai da MESMA consulta que já buscava o nome; nenhuma ida a
  // mais ao banco.
  let tier = 0;

  if (user) {
    // As três colunas da identidade entram no SELECT que já existia — a consulta
    // continua sendo UMA. Elas têm DEFAULT total no banco (skin 2, hair NULL,
    // hairColor 0), então todo usuário é renderizável desde que a linha exista:
    // não há estado "ainda não escolheu" a tratar aqui, e por isso não há prop de
    // fallback no componente. `avatar_chosen` vem junto por outro motivo — é o
    // convite, não o desenho.
    const { data } = await supabase
      .from("users")
      .select(
        "display_name, level, role, avatar_skin, avatar_cabelo, avatar_hair_color, avatar_chapeu, avatar_rosto, avatar_chosen",
      )
      .eq("id", user.id)
      .single();
    profile = data;

    const { data: titleData } = await supabase
      .from("user_titles")
      .select("current_title, achieved_tier")
      .eq("user_id", user.id)
      .single();
    if (titleData?.current_title) {
      title = titleData.current_title;
    }
    tier = titleData?.achieved_tier ?? 0;
  }

  const displayName = profile?.display_name || user?.email || "Usuário";
  const level = profile?.level ?? 1;

  /**
   * O boneco da navbar — e o convite para quem nunca o montou.
   *
   * Só `/dashboard` exige `avatar_chosen` (`dashboard/page.tsx:67-69`). Um aluno
   * que caia direto em `/perfil` por link aparece com o boneco padrão sem nunca
   * ter passado pela criação, e espalhar o `redirect` por todas as rotas seria
   * pagar uma consulta a mais em cada uma para tapar um buraco de link.
   *
   * Agora que o boneco está na navbar, a navbar é o lugar certo do convite: quem
   * não escolheu vê o boneco padrão, que é um boneco legítimo, com um link para
   * `/criar-personagem`. Quem já escolheu não vê link nenhum — o avatar ali é
   * identidade, não navegação, e um link a mais na barra é ruído.
   */
  const boneco = profile ? (
    // Sem `rotulo`: o nome do aluno está escrito ao lado, e anunciar "avatar" de
    // novo é ruído, não acessibilidade.
    <AvatarCabeca
      skin={profile.avatar_skin}
      hair={profile.avatar_cabelo}
      hairColor={profile.avatar_hair_color}
      chapeu={profile.avatar_chapeu}
      rosto={profile.avatar_rosto}
      lado={32}
      ns="nav"
    />
  ) : null;

  return (
    <div className="overflow-x-hidden">
      {user && (
        <nav className="border-b border-ink/10 bg-warm-ivory">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-1 px-4 py-2">
            <div className="flex min-w-0 items-center gap-3">
              {/*
                O boneco do aluno, 32 px — no lugar do círculo de iniciais.

                `rounded-lg` e NÃO `rounded-full`, e isso é medido: o recorte é
                quadrado, e um círculo inscrito nele tem só 46 unidades de largura
                na altura em que o moicano começa (contra as 335 que a crista
                ocupa). O círculo comeria o topo de todo cabelo alto. `rounded-lg`
                também é o raio padrão do DESIGN.md.

                DOIS ANÉIS NÃO DISPUTAM O MESMO BONECO. Quem ainda não montou o
                personagem vê o anel de OURO — o convite —, e não a moldura de
                patente: a "One Gold Rule" do DESIGN.md diz que numa tela o ouro
                marca uma coisa, e aqui ele marca a ação que falta fazer. A moldura
                aparece assim que o aluno monta o boneco, que é quando ela passa a
                ter o que emoldurar.
              */}
              {profile?.avatar_chosen === false ? (
                <Link
                  href="/criar-personagem"
                  className="inline-flex shrink-0 overflow-hidden rounded-lg ring-2 ring-gold/70 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory"
                >
                  {boneco}
                  <span className="sr-only">Monte seu personagem</span>
                </Link>
              ) : (
                /*
                  O boneco é a porta de volta ao Saguão, e isso resolve um
                  buraco de navegação: a §7 da Bíblia lista "Início" como o
                  primeiro item do menu, e não havia NENHUM caminho de volta —
                  nem link, nem logo clicável. Um oitavo link de texto era a
                  saída óbvia e é a errada: o comentário medido logo abaixo diz
                  que os 7 atuais + "Sair" já somam 451 px numa tela de 375.
                  O boneco já está aqui, já é o elemento mais reconhecível da
                  barra, e levar o aluno para casa não lhe custa um pixel de
                  largura.
                */
                <Link
                  href="/dashboard"
                  className="inline-flex shrink-0 rounded-lg transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory"
                >
                  <MolduraPatente tier={tier}>{boneco}</MolduraPatente>
                  <span className="sr-only">Ir para o Saguão</span>
                </Link>
              )}
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
