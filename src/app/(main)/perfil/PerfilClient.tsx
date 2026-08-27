"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAchievements } from "@/hooks/useAchievements";
import Chocadeira from "@/components/avatar/Chocadeira";
import { AvatarKokeshi } from "@/components/avatar/AvatarKokeshi";
import MolduraPatente from "@/components/avatar/MolduraPatente";
import EditorDeAparencia, {
  type Aparencia,
  type PecaDoCatalogo,
  type SlotDaVitrine,
} from "@/components/avatar/EditorDeAparencia";
import { createClient } from "@/lib/supabase/client";
import Card, { CardTitle } from "@/components/ui/Card";
import AchievementPanel from "@/components/gamification/AchievementPanel";
import { xpForLevel } from "@/lib/gamification/xp";
import { emojiDaInsignia } from "@/lib/gamification/achievementIcons";

/* ================================================================
   Types
   ================================================================ */

/**
 * O que saiu daqui no Bloco D da troca de pilha, e por quê.
 *
 * O boneco (`AvatarDisplay`), o inventário (`InventoryGrid`), os slots
 * equipados (`SlotGrid`), o hook `useInventory` e o botão "Trocar aparência"
 * (`update_avatar_base`) montavam a pilha do avatar v2, que o Bloco B apagou do
 * banco: não há mais `items`, `user_inventory`, `user_equipped`, `equip_item`
 * nem `unequip_slot`. Sem tabela por baixo, a tela mostrava zeros.
 *
 * A Chocadeira ficou — e desde o E.2 ela fica VAZIA, porque nenhum baú cria ovo
 * até haver pet. É por isso que ela mostra o "em breve" em vez de sumir.
 *
 * O E.4 devolveu o avatar: o `<AvatarKokeshi>` é o palco do cabeçalho, e o
 * `<EditorDeAparencia>` ocupa a coluna que era do inventário. O RESTO desta tela
 * continua em Tailwind cru (stone-/amber-) — é dívida anterior ao bloco, e migrá-la
 * é trabalho à parte. Ver docs/avatar/20-troca-de-pilha-plano.md.
 */
interface ProfileData {
  userId: string;
  displayName: string;
  level: number;
  xp: number;
  puzzleRating: number;
  puzzleBestStreak: number;
  title: string;
  /**
   * O NÚMERO do título, para a moldura do palco. 0 é Calouro, e é degrau real —
   * não ausência de dado. Sai da mesma consulta a `user_titles` que já buscava o
   * nome, então não custa ida a mais ao banco.
   */
  achievedTier: number;
  currentStreak: number;
  longestStreak: number;
  memberSince: string;
  rush3min: number;
  rush5min: number;
  rushResistencia: number;
}

interface PerfilClientProps {
  profile: ProfileData;
  /** As 3 colunas do Bloco C, como o servidor as gravou. É o palco em repouso. */
  aparencia: Aparencia;
  /** `avatar_catalogo` do slot cabelo, inteiro, com `possui` já resolvido. */
  catalogoCabelo: PecaDoCatalogo[];
  /** `avatar_catalogo` do slot traje, inteiro, com `possui` já resolvido. */
  catalogoTraje: PecaDoCatalogo[];
  /** `avatar_catalogo` do slot rosto, inteiro, com `possui` já resolvido. */
  catalogoRosto: PecaDoCatalogo[];
  /**
   * `avatar_catalogo` do slot `oculos` — SLOT PRÓPRIO desde 2026-08-27.
   *
   * Lista separada da do rosto, e não um filtro dela: o aluno veste os dois ao mesmo
   * tempo, e cada slot tem a própria coluna em `users`.
   */
  catalogoOculos: PecaDoCatalogo[];
  /** `users.avatar_traje`. `null` é o macacão de treino — ausência de peça. */
  trajeInicial: string | null;
  /** `users.avatar_rosto`. `null` é rosto limpo. */
  rostoInicial: string | null;
  /** `users.avatar_oculos`. `null` é sem óculos. */
  oculosInicial: string | null;
  botsDefeated: number;
  lessonsCompleted: number;
  puzzlesSolved: number;
}

/* ================================================================
   SVG Icons (inline, no emoji)
   ================================================================ */

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-stone-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconRook() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" opacity={0.8}>
      <path d="M5 2h2v3h2V2h6v3h2V2h2v5h-2v2h1v2H6v-2h1V7H5V2zm2 11h10l1 7H6l1-7zm2 2l-.5 3h7l-.5-3H9z"/>
    </svg>
  );
}

function IconBolt() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" opacity={0.7}>
      <path d="M13 2L4.09 12.65a1 1 0 00.76 1.65H11v6.7a.5.5 0 00.9.3L20.91 11.35a1 1 0 00-.76-1.65H13V3.3a.5.5 0 00-.9-.3z"/>
    </svg>
  );
}

function IconTarget() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} opacity={0.7}>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  );
}

function IconTimer() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} opacity={0.7}>
      <circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M10 2h4M12 2v3"/>
    </svg>
  );
}

function IconBot() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" opacity={0.8}>
      <path d="M12 2a1 1 0 011 1v1h2a3 3 0 013 3v2a1 1 0 01-1 1h-1v4a3 3 0 01-3 3h-2v2h1a1 1 0 010 2H8a1 1 0 010-2h1v-2H7a3 3 0 01-3-3v-4H3a1 1 0 01-1-1V7a3 3 0 013-3h2V3a1 1 0 011-1h4zM7 6a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1H7zm2 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
    </svg>
  );
}

function IconBook() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} opacity={0.7}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  );
}

function IconFlame() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" opacity={0.7}>
      <path d="M12 2c-1 4-4 6-4 10a6 6 0 008.9 5.24A4 4 0 0114 13c0-2 1.5-3.5 2-5-1.5 1-3 3.5-3 6a2 2 0 004 0c0-4.5-5-7-5-12z"/>
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" opacity={0.7}>
      <path d="M7 4V2h10v2h3a1 1 0 011 1v3c0 2.21-1.79 4-4 4h-.54A6.01 6.01 0 0113 15.92V18h2a2 2 0 012 2H7a2 2 0 012-2h2v-2.08A6.01 6.01 0 017.54 12H7c-2.21 0-4-1.79-4-4V5a1 1 0 011-1h3zm-2 2v2c0 1.1.9 2 2 2h.3A6.03 6.03 0 017 7.5V6H5zm14 0h-2v1.5A6.03 6.03 0 0116.7 10H17c1.1 0 2-.9 2-2V6z"/>
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" opacity={0.7}>
      <path d="M12 2l8 4v6c0 5.25-3.4 9.74-8 11-4.6-1.26-8-5.75-8-11V6l8-4zm0 2.18L6 7.08v4.92c0 4.08 2.55 7.59 6 8.83 3.45-1.24 6-4.75 6-8.83V7.08L12 4.18z"/>
    </svg>
  );
}

/* ================================================================
   Collapsible Section
   ================================================================ */

function CollapsibleSection({
  title,
  badge,
  defaultOpen = true,
  highlight = false,
  children,
}: {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`overflow-hidden rounded-2xl border shadow-sm ${
      highlight ? "border-amber-300/80 bg-gradient-to-b from-amber-50/50 to-white" : "border-stone-200/80 bg-white"
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors ${
          highlight ? "hover:bg-amber-50/50" : "hover:bg-stone-50/50"
        }`}
      >
        <div className="flex-1 border-l-[3px] border-amber-400 pl-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${
            highlight ? "text-amber-800" : "text-stone-600"
          }`}>
            {title}
          </h3>
          {badge && (
            <span className={`text-[10px] font-semibold ${highlight ? "text-amber-600" : "text-stone-400"}`}>{badge}</span>
          )}
        </div>
        <IconChevron open={open} />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out ${
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="px-5 pb-5">{children}</div>
      </div>
    </section>
  );
}

/* ================================================================
   Stat Card
   ================================================================ */

function StatCard({
  icon,
  value,
  label,
  accent = false,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl border px-2 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        accent
          ? "border-amber-300/80 bg-gradient-to-b from-amber-100/80 via-amber-50/50 to-white shadow-sm shadow-amber-100/50"
          : "border-stone-200/80 bg-gradient-to-b from-stone-50/80 to-white"
      }`}
    >
      <span className={accent ? "text-amber-700" : "text-stone-500"}>{icon}</span>
      <span
        className={`mt-1 text-2xl font-black tabular-nums leading-tight ${
          accent ? "text-amber-900" : "text-stone-800"
        }`}
      >
        {value}
      </span>
      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
        {label}
      </span>
    </div>
  );
}

/* ================================================================
   Hero Quick Stat Badge
   ================================================================ */

function QuickStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-stone-200/80 bg-white/90 px-3 py-2 shadow-sm">
      <span className="text-amber-600">{icon}</span>
      <div>
        <p className="text-lg font-black leading-tight tabular-nums text-stone-900">{value}</p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
      </div>
    </div>
  );
}

/* ================================================================
   Achievement Preview Card
   ================================================================ */

function AchievementPreviewCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  const emoji = emojiDaInsignia(icon);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-white px-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-sm">
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-stone-800">{title}</p>
        <p className="truncate text-xs text-stone-500">{description}</p>
      </div>
    </div>
  );
}

/* ================================================================
   Main Component
   ================================================================ */

export default function PerfilClient({
  profile,
  aparencia,
  catalogoCabelo,
  catalogoTraje,
  catalogoRosto,
  catalogoOculos,
  trajeInicial,
  rostoInicial,
  oculosInicial,
  botsDefeated,
  lessonsCompleted,
  puzzlesSolved,
}: PerfilClientProps) {
  const router = useRouter();
  const { achievements, loading: achievementsLoading } = useAchievements();
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  // O palco do cabeçalho desenha ESTE estado, não o do servidor: mexer numa
  // amostra tem de aparecer no boneco grande na mesma hora, senão o aluno não
  // sabe se a escolha pegou. `salvo` guarda o que o servidor confirmou, e a
  // diferença entre os dois é o que o aviso de "não salvo" mede.
  const [salvo, setSalvo] = useState<Aparencia>(aparencia);
  const [emProva, setEmProva] = useState<Aparencia>(aparencia);
  // O cabelo saiu desta conta em 2026-08-23: ele grava no clique, então nunca
  // está "não salvo". Sobraram as duas cores, que são o que o botão manda.
  const naoSalvo =
    emProva.skin !== salvo.skin || emProva.hairColor !== salvo.hairColor;

  // AS PEÇAS NÃO TÊM ESTADO "EM PROVA", e a assimetria é do banco: `equipar_peca`
  // recebe um slot por chamada e é idempotente, então vestir já é o fato. Estes
  // estados só existem para o palco repintar sem esperar o `router.refresh()` — e
  // eles só mudam DEPOIS de o servidor confirmar.
  //
  // ⚠️ O CABELO ENTROU NESSE REGIME EM 2026-08-23, e é a única mudança de
  // comportamento que o aluno percebe: ele deixou de ser "em prova" junto com as
  // cores e passou a gravar no clique, como o traje. O `naoSalvo` acima continua
  // medindo só o que ainda espera o botão — as duas cores da emenda à D27.
  const [traje, setTraje] = useState<string | null>(trajeInicial);
  const [rosto, setRosto] = useState<string | null>(rostoInicial);
  // Estado SEPARADO do rosto, e é o que faz a combinação existir: enquanto os dois
  // dividiam o slot, este era o mesmo `useState` e um clique tirava o outro.
  const [oculos, setOculos] = useState<string | null>(oculosInicial);

  /**
   * A PRIMEIRA CHAMADORA DE `equipar_peca` — ela existia desde o Bloco 1 e nunca
   * tinha sido usada.
   *
   * Devolve a mensagem de erro do servidor, ou `null` se deu certo. O palco só
   * repinta **depois** do `await`: um otimista aqui mostraria a criança vestida com
   * uma peça que a RPC recusou, e a recusa é o ponto (Regra Inviolável nº 1).
   *
   * Sem `router.refresh()`: o único dado da página que muda é `avatar_traje`, e ele
   * já está no estado local. Recarregar a árvore inteira por uma troca de roupa
   * custaria as seis consultas do `page.tsx` a cada clique.
   */
  async function trocarPeca(
    slot: SlotDaVitrine,
    slug: string | null,
  ): Promise<string | null> {
    const supabase = createClient();
    const { error } = await supabase.rpc("equipar_peca", {
      p_slot: slot,
      p_slug: slug,
    });
    if (error) return `Não foi possível vestir essa peça. ${error.message}`;
    if (slot === "traje") setTraje(slug);
    else if (slot === "rosto") setRosto(slug);
    else if (slot === "oculos") setOculos(slug);
    else {
      // O cabelo mora nos DOIS estados de aparência porque é o palco que o
      // desenha: `emProva` para repintar agora, `salvo` para o aviso de "não
      // salvo" não acusar uma peça que o servidor já gravou.
      setEmProva((a) => ({ ...a, hair: slug }));
      setSalvo((a) => ({ ...a, hair: slug }));
    }
    return null;
  }

  // --- XP ---
  const xpNeeded = xpForLevel(profile.level);
  const xpPercent = Math.min(100, Math.round((profile.xp / xpNeeded) * 100));

  // --- Date ---
  const memberDate = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "";

  // --- Achievements preview ---
  const unlockedAchievements = achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => {
      const dateA = a.unlocked_at ? new Date(a.unlocked_at).getTime() : 0;
      const dateB = b.unlocked_at ? new Date(b.unlocked_at).getTime() : 0;
      return dateB - dateA;
    });
  const previewAchievements = unlockedAchievements.slice(0, 4);
  const unlockedCount = unlockedAchievements.length;

  // --- Best rush ---
  const bestRush = Math.max(profile.rush3min, profile.rush5min, profile.rushResistencia);

  // --- Stats data (hero already shows Rating, Best Rush, Bots, Coleção) ---
  const statGroups = [
    {
      label: "Tática",
      stats: [
        { icon: <IconTarget />, value: puzzlesSolved.toString(), label: "Desafios", accent: true },
        { icon: <IconBolt />, value: profile.puzzleBestStreak > 0 ? profile.puzzleBestStreak.toString() : "—", label: "Melhor Seq.", accent: false },
        { icon: <IconFlame />, value: profile.longestStreak > 0 ? profile.longestStreak.toString() : "—", label: "Rec. Streak", accent: false },
      ],
    },
    {
      label: "Velocidade",
      stats: [
        { icon: <IconTimer />, value: profile.rush3min > 0 ? profile.rush3min.toString() : "—", label: "Rush 3min", accent: false },
        { icon: <IconTimer />, value: profile.rush5min > 0 ? profile.rush5min.toString() : "—", label: "Rush 5min", accent: false },
        { icon: <IconTimer />, value: profile.rushResistencia > 0 ? profile.rushResistencia.toString() : "—", label: "Resistência", accent: false },
      ],
    },
    {
      label: "Progressão",
      stats: [
        { icon: <IconBook />, value: lessonsCompleted.toString(), label: "Aulas", accent: false },
        { icon: <IconBot />, value: `${botsDefeated}/10`, label: "Bots", accent: false },
        { icon: <IconTrophy />, value: `${unlockedCount}/${achievements.length}`, label: "Conquistas", accent: false },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* ============================================================
            PAGE TITLE
            ============================================================ */}
        <div className="mb-5 flex items-center gap-4">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-amber-400/70 via-amber-300/40 to-transparent" />
          <h1 className="shrink-0 text-center text-base font-black uppercase tracking-[0.25em] text-stone-600 sm:text-lg">
            Registro de Formação
          </h1>
          <div className="h-[2px] flex-1 bg-gradient-to-l from-amber-400/70 via-amber-300/40 to-transparent" />
        </div>

        {/* ============================================================
            HERO CARD — Avatar-centered player card layout
            ============================================================ */}
        <div className="mx-auto mb-2 max-w-3xl overflow-visible rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/50 via-white to-stone-50 shadow-md">
          <div className="flex flex-col items-center px-5 py-2 lg:px-6 lg:py-3">
            {/* --- Name + Title (above avatar) --- */}
            <h2 className="text-center text-base font-black tracking-tight text-stone-900 lg:text-lg">
              {profile.displayName}
            </h2>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-200/80 to-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 shadow-sm ring-2 ring-amber-300/40">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {profile.title}
            </span>

            {/* --- O palco ---
                O boneco voltou no E.4, e voltou desenhando o estado EM PROVA:
                mexer numa amostra lá embaixo repinta a criança aqui em cima. É o
                único boneco grande da tela — o editor não tem prévia própria, de
                propósito, para não existirem dois bonecos disputando o papel de
                "quem eu sou". */}
            {/* A moldura tem 3 px aqui, como no perfil público: um fio de 2 px
                sumiria contra um boneco de 168. É a mesma cor de patente que a
                navbar e o ranking desenham — o degrau é um só, e ele não pode
                mudar de tom de tela para tela. */}
            <div className="mt-3 grid place-items-center">
              <MolduraPatente tier={profile.achievedTier} espessura={3}>
                <AvatarKokeshi
                  skin={emProva.skin}
                  hair={emProva.hair}
                  hairColor={emProva.hairColor}
                  traje={traje}
                  rosto={rosto}
                  // O `oculos` faltava aqui desde que o slot nasceu, e a falta era
                  // MUDA: prop opcional ausente não é erro de `typecheck`, então o
                  // aluno equipava o óculos, o banco gravava, a navbar desenhava — e
                  // este palco, o boneco grande do próprio perfil, saía sem ele.
                  oculos={oculos}
                  altura={168}
                  animado
                  ns="palco"
                  rotulo={`Avatar de ${profile.displayName}`}
                />
              </MolduraPatente>
            </div>

            {/* --- Quick stats ---
                As duas colunas de stat que flanqueavam o boneco no desktop, e o
                grid 2×2 que as repetia no mobile, viraram um grid de 3 igual nas
                duas larguras no Bloco D. Ele ficou: o palco voltou por cima, não
                no meio. A quarta stat era "Coleção" e saiu com o inventário. */}
            <div className="mt-4 grid w-full max-w-sm grid-cols-3 gap-2">
              <QuickStat icon={<IconRook />} value={profile.puzzleRating.toString()} label="Rating" />
              <QuickStat icon={<IconBolt />} value={profile.puzzleBestStreak > 0 ? profile.puzzleBestStreak.toString() : "—"} label="Sequência" />
              <QuickStat icon={<IconBot />} value={`${botsDefeated}/10`} label="Bots" />
            </div>

            {/* --- XP + metadata (below avatar) --- */}
            <div className="mt-4 w-full max-w-md">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-base font-black text-stone-800">
                  Nível {profile.level}
                </span>
                <span className="text-xs font-bold tabular-nums text-stone-400">
                  {profile.xp}/{xpNeeded} XP
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-stone-200 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 transition-all duration-700 ease-out"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              {/*
                NÍVEL × TÍTULO, dito de uma vez — o registro de formação é o
                lugar certo, porque é aqui que os dois números aparecem juntos.
                São duas progressões com ritmos deliberadamente diferentes: o
                nível sobe com qualquer atividade, o título só com trilha
                concluída (~um semestre). Sem esta linha, a lentidão do título
                lê como defeito em vez de projeto.
              */}
              <p className="mt-2 text-center text-xs text-ink/55">
                O nível mede sua presença. O título mede sua formação.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm">
              {profile.currentStreak > 0 && (
                <span className="flex items-center gap-1.5 font-bold text-orange-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-1 4-4 6-4 10a6 6 0 008.9 5.24A4 4 0 0114 13c0-2 1.5-3.5 2-5-1.5 1-3 3.5-3 6a2 2 0 004 0c0-4.5-5-7-5-12z"/></svg>
                  {profile.currentStreak} {profile.currentStreak === 1 ? "dia" : "dias"}
                </span>
              )}
              {memberDate && (
                <span className="flex items-center gap-1 text-stone-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Desde {memberDate}
                </span>
              )}
            </div>

            <Link
              href={`/perfil/${profile.userId}`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-600 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver perfil público
            </Link>
          </div>
        </div>

        {/* Decorative separator */}
        <div className="mx-auto mb-5 mt-1 h-[2px] w-2/3 bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />

        {/* ============================================================
            BODY — 2-column on desktop
            ============================================================ */}
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_0.8fr] lg:items-start lg:gap-5">
          {/* --- Left Column: Stats + Insígnias --- */}
          <div className="flex flex-col gap-5">
            {/* STATS */}
            <CollapsibleSection title="Desempenho do aluno">
              <div className="space-y-4">
                {statGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {group.stats.map((s) => (
                        <StatCard
                          key={s.label}
                          icon={s.icon}
                          value={s.value}
                          label={s.label}
                          accent={s.accent}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* INSÍGNIAS — preview + expandable full panel */}
            <section className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
              <div className="border-l-[3px] border-amber-400 px-5 py-4">
                <div className="flex items-center justify-between pl-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">
                    Conquistas
                  </h3>
                  <span className="text-xs font-bold tabular-nums text-amber-700">
                    {unlockedCount}/{achievements.length}
                  </span>
                </div>
              </div>

              <div className="px-5 pb-5">
                {achievementsLoading ? (
                  <div className="flex items-center justify-center py-6 text-sm text-stone-400">
                    Carregando...
                  </div>
                ) : previewAchievements.length > 0 ? (
                  <div className="space-y-2">
                    {previewAchievements.map((ach) => (
                      <AchievementPreviewCard
                        key={ach.id}
                        title={ach.title}
                        description={ach.description}
                        icon={ach.icon}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-stone-400">
                    Nenhuma conquista desbloqueada ainda.
                  </p>
                )}

                <button
                  onClick={() => setShowAllAchievements(!showAllAchievements)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 py-2.5 text-sm font-semibold text-stone-500 transition-colors hover:border-amber-400 hover:text-amber-700"
                >
                  {showAllAchievements ? "Ocultar detalhes" : "Ver todas as conquistas"}
                  <IconChevron open={showAllAchievements} />
                </button>

                {showAllAchievements && (
                  <div className="mt-4">
                    <AchievementPanel />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* --- Right Column: Aparência + Chocadeira ---
              "Equipamentos da Campanha" (SlotGrid) e "Personalizar Avatar"
              (InventoryGrid) saíram com o inventário v2; o editor de aparência do
              E.4 ocupa este lugar. A Chocadeira fica abaixo dele, vazia, com o
              "em breve" — decisão do Doug, não descuido. */}
          <div className="flex flex-col gap-5">
            <Card className="p-5">
              <CardTitle>Aparência</CardTitle>
              <EditorDeAparencia
                valor={emProva}
                aoMudar={setEmProva}
                cabelos={catalogoCabelo}
                trajes={catalogoTraje}
                traje={traje}
                rostos={catalogoRosto}
                rosto={rosto}
                oculos={catalogoOculos}
                oculosAtual={oculos}
                aoTrocarPeca={trocarPeca}
                nivel={profile.level}
                tier={profile.achievedTier}
                rotuloAcao="Salvar aparência"
                aoSalvar={() => {
                  setSalvo(emProva);
                  // O servidor confirmou; `refresh` traz de volta o que só ele
                  // sabe — inclusive o nível, que é o que destrava a próxima
                  // peça. Sem ele, um level-up recente não abriria o cadeado até
                  // o aluno recarregar a página na mão.
                  router.refresh();
                }}
              />
              {naoSalvo && (
                <p className="mt-3 text-xs text-ink/70">
                  Você está provando um visual novo. Ele só vale depois de salvar.
                </p>
              )}
            </Card>

            <Chocadeira />
          </div>
        </div>
      </div>
    </div>
  );
}
