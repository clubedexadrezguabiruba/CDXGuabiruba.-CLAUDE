"use client";

/**
 * O EDITOR DE APARÊNCIA — os controles, e só os controles.
 *
 * ---------------------------------------------------------------------------
 * ELE É CONTROLADO, E O PALCO É DA TELA
 * ---------------------------------------------------------------------------
 *
 * O boneco grande **não** nasce aqui. Em `/perfil` ele é o palco do cabeçalho; em
 * `/criar-personagem` ele é o herói da tela. Se o editor trouxesse um preview
 * próprio, as duas telas teriam DOIS bonecos — um "quem eu sou" e um "o que estou
 * provando" — e o aluno teria de descobrir sozinho qual dos dois manda.
 *
 * Então o estado sobe: a tela guarda a `Aparencia`, desenha o palco com ela, e
 * passa `valor`/`aoMudar` para cá. Um boneco grande por tela, e ele é a prévia.
 *
 * ---------------------------------------------------------------------------
 * AS PRÉVIAS PEQUENAS SÃO O SEGUNDO PREVIEW, E DE GRAÇA
 * ---------------------------------------------------------------------------
 *
 * Cada opção de cabelo desenha a MESMA criança com aquele modelo. Trocar a cor do
 * cabelo ou o tom de pele repinta as seis de uma vez — a comparação lado a lado
 * sai sem nenhuma tela extra. É por isso que o `ns` do `<AvatarKokeshi>` é por
 * instância e não por aluno: com um `ns` só, as seis prévias resolveriam para o
 * gradiente da primeira e a troca de pele não apareceria em nenhuma.
 *
 * ---------------------------------------------------------------------------
 * QUEM DECIDE O QUE ESTÁ TRAVADO É O SERVIDOR
 * ---------------------------------------------------------------------------
 *
 * O `min_level` desenhado aqui vem de `avatar_hair_catalog`, lido pela tela no
 * servidor. O cadeado é INFORMAÇÃO, não trava: quem recusa é
 * `update_avatar_identity`, que compara o nível dentro da transação (Regra
 * Inviolável nº 1). Editar o DOM para habilitar o botão continua batendo na
 * exceção da RPC, e a mensagem dela aparece no bloco de erro abaixo.
 *
 * A careca não é linha do catálogo — é `avatar_hair IS NULL`, ausência de peça, e
 * por isso é sempre livre. Ela entra na lista aqui, na primeira posição, porque no
 * catálogo do banco ela não existe de propósito (migration do Bloco C).
 */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { AvatarKokeshi } from "@/components/avatar/AvatarKokeshi";
import { AvatarTronco } from "@/components/avatar/AvatarTronco";
import { CABELOS } from "@/lib/avatar/estilo/cabelo";
import { TRAJES_DA_ARTE } from "@/lib/avatar/estilo/trajes-da-arte";
import { CABELO, PELE } from "@/lib/avatar/palette";
import { cn } from "@/lib/cn";

/** As três colunas do Bloco C, na língua do banco: índice, slug, índice. */
export interface Aparencia {
  skin: number;
  hair: string | null;
  hairColor: number;
}

/** Uma linha de `avatar_hair_catalog`, como a tela a lê no servidor. */
export interface CabeloDoCatalogo {
  slug: string;
  min_level: number;
}

/**
 * Uma linha de `avatar_catalogo` do slot `traje`, como a tela a lê no servidor.
 *
 * O aluno lê o catálogo INTEIRO, inclusive as peças que ainda não tem — é o que
 * permite a vitrine. Quem recusa é `equipar_peca`, não esta lista.
 */
export interface TrajeDoCatalogo {
  slug: string;
  origem: "marco_nivel" | "marco_patente" | "bau";
  min_level: number | null;
  min_tier: number | null;
  raridade: "common" | "rare" | "epic" | "legendary" | null;
  /** `true` se o aluno tem linha em `avatar_guarda_roupa` para este slug. */
  possui: boolean;
}

/**
 * A cor de cada raridade — a SEGUNDA linguagem de cor do produto.
 *
 * Ela vive **só aqui**, na vitrine e nos cards do editor, e nunca em volta de um
 * avatar: ali quem manda é a cor de PATENTE, pela `<MolduraPatente>`. As duas no
 * mesmo elemento ensinam o aluno que cor não significa nada (DESIGN.md, "The Two
 * Color Languages Rule").
 *
 * Os hexadecimais são os do `EggHatchingModal`, que já desenhava moldura de
 * raridade desde a v2 — reusar em vez de escolher de novo evita a segunda paleta
 * que diverge da primeira.
 */
const COR_DA_RARIDADE: Record<NonNullable<TrajeDoCatalogo["raridade"]>, string> = {
  common: "#94A3B8",
  rare: "#3A55B5",
  epic: "#7A3168",
  legendary: "#C9A84C",
};

const NOME_DA_RARIDADE: Record<NonNullable<TrajeDoCatalogo["raridade"]>, string> = {
  common: "Comum",
  rare: "Rara",
  epic: "Épica",
  legendary: "Lendária",
};

/**
 * Rótulos das 8 cores de cabelo, na ordem de `CABELO` em `palette.ts`.
 *
 * São **copy**, não paleta: o hex continua morando em um lugar só. Existem porque
 * um leitor de tela não lê `#E0B457`, e porque a "Colorblind Rule" do DESIGN.md
 * pede que a cor nunca informe sozinha — o nome do que está selecionado fica
 * escrito ao lado do título do grupo.
 */
const NOMES_COR_CABELO = [
  "Preto",
  "Castanho",
  "Castanho claro",
  "Loiro",
  "Ruivo",
  "Grisalho",
  "Roxo",
  "Azul",
];

/**
 * Rótulos dos 8 tons de pele. Numerados de propósito: nomear tom de pele com
 * palavra (de "claro" a "escuro", ou pior, com comida) é decisão que nenhuma tela
 * de criança precisa carregar. O número é neutro e a amostra é a informação.
 */
const NOMES_PELE = Array.from({ length: PELE.length }, (_, i) => `Tom ${i + 1}`);

/** Slug → nome que o aluno lê. Slug fora do catálogo do código sai como slug. */
function nomeDoModelo(slug: string): string {
  return (CABELOS as Record<string, { nome: string } | undefined>)[slug]?.nome ?? slug;
}

/**
 * Slug → nome da peça de traje. `undefined` quando o código ainda não a desenha.
 *
 * O nome vem de `TRAJES_DA_ARTE`, que é GERADO pela esteira: ele é consequência de
 * existir arte renderizável, nunca uma segunda lista que pode discordar do banco.
 */
function nomeDoTraje(slug: string): string | undefined {
  return TRAJES_DA_ARTE[slug]?.nome;
}

function IconeCadeado({ className }: { className?: string }) {
  return (
    <svg className={cn("h-3 w-3", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" />
    </svg>
  );
}

function IconeCheck({ className }: { className?: string }) {
  return (
    <svg className={cn("h-3 w-3", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconeAlerta({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" strokeLinecap="round" />
      <path d="M12 16.5v.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * O título de GRUPO é Inter, e não Cinzel — duas razões, e as duas medidas.
 *
 * A "Cinzel Scarcity Rule" do DESIGN.md reserva a capitalis para título de TELA e
 * de BLOCO; "Cabelo" e "Tom de pele" são rótulos dentro de um bloco. E a primeira
 * versão daqui usava a mesma linha do `CardTitle` — 13px Cinzel versalete —, o que
 * deixava "Aparência" (o bloco) e "Cabelo" (um grupo dentro dele) **idênticos**,
 * a 31px um do outro. Dois níveis com a mesma voz é zero nível.
 */
const TITULO_DE_GRUPO =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/70";

const FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory";

/**
 * Uma fileira de amostras de cor.
 *
 * **Grade de 4, não `flex-wrap`.** Com quebra automática as 8 amostras davam 5+3
 * em 375px, 8+0 em 1280 e **6+2** na coluna estreita do perfil — e a fileira órfã
 * de duas lê como layout quebrado, não como escolha. Quatro colunas dão 4+4 em
 * qualquer largura, medido nas três.
 *
 * **E `w-fit`, que não é detalhe.** Sem ele as 4 colunas dividem a largura toda:
 * medido em 1280, deram 117px de branco entre discos de 32px, e a paleta deixou
 * de ler como paleta. Com `w-fit` a coluna encolhe para o alvo de 44px, os discos
 * ficam a 8px um do outro e a fileira alinha à esquerda com o próprio título —
 * que era a segunda coisa que a grade solta tinha quebrado.
 *
 * O alvo continua de 44px (DESIGN.md, "a mão é de criança"); o disco de cor é
 * menor que o alvo de propósito, porque quem tem de caber em 44 é o dedo.
 */
function FileiraDeCores({
  titulo,
  cores,
  nomes,
  indice,
  aoEscolher,
  nota,
}: {
  titulo: string;
  cores: readonly string[];
  nomes: readonly string[];
  indice: number;
  aoEscolher: (i: number) => void;
  nota?: string;
}) {
  return (
    <section>
      {/*
        O `w-fit` embrulha EXATAMENTE cabeçalho + grade, e nada mais.

        Ele existe porque cabeçalho e amostras têm de medir a mesma coisa: com a
        grade encolhida e o cabeçalho em largura cheia, o nome da cor escolhida ia
        parar a 360px das amostras que ele nomeia. Mas `fit-content` é a largura
        do filho MAIS LARGO — e a nota de dica, que é uma frase de 310px, mandava
        na seção inteira quando ficava aqui dentro: os discos abriam para 47px de
        vão e o cabeçalho desalinhava 27px, justamente no estado padrão de quem
        acabou de chegar (nível 1, careca, dica visível). A nota vai FORA.
      */}
      <div className="w-fit max-w-full">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className={TITULO_DE_GRUPO}>{titulo}</h3>
          <span className="truncate text-xs text-ink/70">{nomes[indice] ?? "—"}</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {cores.map((cor, i) => {
            const escolhida = i === indice;
            return (
              <button
                key={cor}
                type="button"
                aria-pressed={escolhida}
                aria-label={nomes[i]}
                onClick={() => aoEscolher(i)}
                className={cn(
                  "relative grid h-11 w-11 place-items-center rounded-full border transition-colors",
                  FOCO,
                  escolhida ? "border-gold" : "border-ink/10 hover:border-gold/60"
                )}
              >
                {/* O fio do disco é `ink/40`, e não `ink/10` como o resto dos
                    fios do sistema: medidos contra o branco do card, o Tom 1
                    (#FFE2C7), o Tom 2 e o Grisalho ficam em 1,2–1,5:1 e SOMEM.
                    O fio é a única coisa que prova que há uma amostra ali. */}
                <span
                  aria-hidden
                  className="h-8 w-8 rounded-full border border-ink/40"
                  style={{ background: cor }}
                />
                {/* A forma além da cor: sem o tique, "qual está escolhida" seria
                    uma diferença de fio de 1px entre oito círculos coloridos. */}
                {escolhida && (
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border border-gold bg-white text-ink"
                  >
                    <IconeCheck className="h-2.5 w-2.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {nota && <p className="mt-2 max-w-xs text-xs text-ink/70">{nota}</p>}
    </section>
  );
}

/**
 * A VITRINE DO TRAJE — e ela é o oposto de uma lista do que o aluno tem.
 *
 * ---------------------------------------------------------------------------
 * POR QUE A PEÇA QUE ELE NÃO TEM APARECE
 * ---------------------------------------------------------------------------
 *
 * Vitrine é o que faz raridade significar alguma coisa. Sem ela o aluno não sabe
 * que existe o que não tem, e o baú entrega uma surpresa sem antecipação — que é
 * metade do que um baú é. Decisão do doc 21 §1.2, e é ela que este bloco cumpre.
 *
 * A peça de baú que ele ainda não ganhou aparece em **silhueta com "?"**, na cor da
 * raridade. A peça de marco aparece com o cadeado de sempre, informando o que falta.
 *
 * ---------------------------------------------------------------------------
 * O CADEADO É INFORMAÇÃO, NUNCA TRAVA
 * ---------------------------------------------------------------------------
 *
 * Quem recusa é `equipar_peca`, que confere o direito dentro da transação (Regra
 * Inviolável nº 1). Editar o DOM para habilitar o botão continua batendo na exceção
 * da RPC, e a mensagem dela aparece no bloco de erro. É a mesma regra que o seletor
 * de cabelo já segue.
 *
 * ---------------------------------------------------------------------------
 * A ROUPA SALVA NA HORA, E A IDENTIDADE NÃO — a assimetria é do banco
 * ---------------------------------------------------------------------------
 *
 * `update_avatar_identity` recebe as TRÊS colunas de uma vez, então a identidade
 * tem um estado "em prova" que só vira fato no botão. `equipar_peca` recebe **um
 * slot por chamada** e é idempotente: não há o que juntar, e um botão de salvar
 * para uma coisa que já é uma chamada só seria cerimônia.
 *
 * Então vestir é imediato — como num guarda-roupa de jogo. O palco repinta quando o
 * servidor confirma, nunca antes: `aoTrocarTraje` só é chamado depois do `await`.
 */
function Vitrine({
  trajes,
  atual,
  nivel,
  tier,
  aoTrocar,
}: {
  trajes: TrajeDoCatalogo[];
  atual: string | null;
  nivel: number;
  tier: number;
  aoTrocar: (slug: string | null) => Promise<string | null>;
}) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // "Sem traje" primeiro porque é o estado que nenhuma régua nega — o espelho exato
  // do careca. Depois o que o aluno pode usar, e por último o que ele ainda deseja:
  // a lista lida de cima para baixo é a progressão.
  const podeUsar = (t: TrajeDoCatalogo) =>
    t.origem === "bau"
      ? t.possui
      : t.origem === "marco_nivel"
        ? nivel >= (t.min_level ?? 1)
        : tier >= (t.min_tier ?? 0);

  const ordenados = [...trajes].sort((a, b) => {
    const d = Number(podeUsar(b)) - Number(podeUsar(a));
    return d !== 0 ? d : a.slug.localeCompare(b.slug);
  });

  const opcoes = [{ slug: null as string | null }, ...ordenados.map((t) => ({ slug: t.slug, t }))];

  async function escolher(slug: string | null) {
    if (ocupado) return;
    setOcupado(slug ?? "sem-traje");
    setErro(null);
    const msg = await aoTrocar(slug);
    setOcupado(null);
    if (msg) setErro(msg);
  }

  return (
    <section className="max-w-xs">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className={TITULO_DE_GRUPO}>Roupa</h3>
        <span className="truncate text-xs text-ink/70">
          {atual ? (nomeDoTraje(atual) ?? atual) : "Sem traje"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {opcoes.map(({ slug, t }: { slug: string | null; t?: TrajeDoCatalogo }) => {
          const selecionado = slug === atual;
          const livre = !t || podeUsar(t);
          const chave = slug ?? "sem-traje";
          const nome = slug ? (nomeDoTraje(slug) ?? slug) : "Sem traje";
          // Peça de baú não possuída é SILHUETA: o desenho fica escondido, e é
          // isso que cria o desejo. Peça de marco mostra o desenho com cadeado —
          // ela não é surpresa, é degrau, e esconder um degrau não motiva ninguém.
          const emSilhueta = Boolean(t && t.origem === "bau" && !t.possui);
          const cor = t?.raridade ? COR_DA_RARIDADE[t.raridade] : null;

          return (
            <button
              key={chave}
              type="button"
              disabled={!livre || ocupado !== null}
              aria-pressed={selecionado}
              aria-label={
                emSilhueta
                  ? `${nome} — peça ${t?.raridade ? NOME_DA_RARIDADE[t.raridade].toLowerCase() : ""} de baú, você ainda não tem`
                  : !livre
                    ? `${nome} — bloqueado, exige nível ${t?.min_level ?? 1}`
                    : nome
              }
              onClick={() => escolher(slug)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 transition-colors",
                FOCO,
                livre ? "bg-warm-stone" : "bg-white",
                !livre
                  ? "cursor-not-allowed border-dashed border-ink/25"
                  : selecionado
                    ? "border-gold bg-gold/10 ring-1 ring-gold"
                    : "border-ink/25 hover:border-gold/60",
                ocupado !== null && "opacity-70",
              )}
              // A cor da raridade entra como FIO, não como fundo: fundo colorido
              // atrás de um boneco bege mata o contorno preto, que é a silhueta que
              // dá identidade ao personagem.
              style={cor && !livre ? { borderColor: cor } : undefined}
            >
              <span className="relative grid place-items-center">
                <AvatarTronco
                  skin={2}
                  hair={null}
                  hairColor={0}
                  traje={emSilhueta ? null : slug}
                  altura={96}
                  ns={`vit-${chave}`}
                />
                {emSilhueta && (
                  // A silhueta é um véu POR CIMA do tronco vazio, com o "?" na cor
                  // da raridade. Desenhar a peça e cobri-la seria pagar o SVG dela
                  // para não mostrá-lo — e vazaria o desenho no devtools.
                  <span
                    aria-hidden
                    className="absolute inset-0 grid place-items-center rounded-md bg-ink/[0.07] text-2xl font-bold"
                    style={{ color: cor ?? undefined }}
                  >
                    ?
                  </span>
                )}
              </span>
              <span className="text-sm font-semibold leading-tight">{nome}</span>
              <span
                className={cn(
                  "flex min-h-4 items-center gap-1 text-[11px]",
                  livre ? "font-semibold text-ink" : "font-medium text-ink/70",
                )}
              >
                {emSilhueta ? (
                  // O nome da raridade vai ESCRITO junto da cor — "Colorblind
                  // Rule": um fio colorido sozinho não informa nada.
                  <>
                    <IconeCadeado />
                    {t?.raridade ? NOME_DA_RARIDADE[t.raridade] : "De baú"}
                  </>
                ) : !livre ? (
                  <>
                    <IconeCadeado />
                    Nível {t?.min_level ?? 1}
                  </>
                ) : selecionado ? (
                  <>
                    <IconeCheck />
                    Em uso
                  </>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {erro && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-erro/40 bg-erro/5 px-3 py-2 text-sm text-ink"
        >
          <IconeAlerta className="mt-0.5 shrink-0 text-erro" />
          <span>{erro}</span>
        </p>
      )}
    </section>
  );
}

export default function EditorDeAparencia({
  valor,
  aoMudar,
  catalogo,
  trajes,
  traje,
  aoTrocarTraje,
  nivel,
  tier = 0,
  rotuloAcao,
  aoSalvar,
  className,
}: {
  valor: Aparencia;
  aoMudar: (proxima: Aparencia) => void;
  catalogo: CabeloDoCatalogo[];
  /**
   * `avatar_catalogo` do slot traje, INTEIRO — inclusive o que o aluno não tem.
   * Ausente, a aba "Roupa" não aparece: é o que mantém `/criar-personagem` e
   * qualquer chamador antigo idênticos ao de antes deste bloco.
   */
  trajes?: TrajeDoCatalogo[];
  /** `users.avatar_traje`. `null` é o macacão de treino — ausência de peça. */
  traje?: string | null;
  /**
   * Chama `equipar_peca` e devolve a MENSAGEM DE ERRO, ou `null` se deu certo.
   *
   * A tela é quem chama a RPC porque é ela quem repinta o palco: o editor não tem
   * boneco grande de propósito (ver o docstring do topo).
   */
  aoTrocarTraje?: (slug: string | null) => Promise<string | null>;
  /** Nível de XP do aluno. Só decide o que a tela DESENHA travado — ver docstring. */
  nivel: number;
  /** `achieved_tier`. Só decide o que a tela desenha travado, como o nível. */
  tier?: number;
  /** O que o botão diz. "Confirmar" na criação, "Salvar aparência" no perfil. */
  rotuloAcao: string;
  /** Chamado depois de a RPC confirmar. Nunca antes: recompensa é reação a fato. */
  aoSalvar: () => void;
  className?: string;
}) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Careca primeiro porque é o estado que nenhuma escada nega, depois o catálogo
  // do mais barato ao mais caro — a lista lida de cima para baixo é a progressão.
  const opcoes = [
    { slug: null as string | null, nome: "Careca", minLevel: 1 },
    ...[...catalogo]
      .sort((a, b) => a.min_level - b.min_level || a.slug.localeCompare(b.slug))
      .map((c) => ({ slug: c.slug, nome: nomeDoModelo(c.slug), minLevel: c.min_level })),
  ];

  const escolhido = opcoes.find((o) => o.slug === valor.hair);

  async function salvar() {
    if (salvando) return;
    setSalvando(true);
    setErro(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("update_avatar_identity", {
      p_skin: valor.skin,
      p_hair: valor.hair,
      p_hair_color: valor.hairColor,
    });

    setSalvando(false);

    // O erro aparece na tela e diz o que o servidor recusou. Um botão que não
    // responde é indistinguível de um gate falhando — é o defeito que a tela v2
    // já tinha corrigido uma vez, e ele não volta.
    if (error) {
      setErro(`Não foi possível salvar sua aparência. ${error.message}`);
      return;
    }

    aoSalvar();
  }

  return (
    <div className={cn("space-y-6", className)}>
      <section className="max-w-xs">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className={TITULO_DE_GRUPO}>Cabelo</h3>
          <span className="truncate text-xs text-ink/70">{escolhido?.nome ?? "—"}</span>
        </div>

        {/*
          DUAS COLUNAS, EM QUALQUER LARGURA, COM TETO DE 320px NA SEÇÃO.

          Com três colunas em 375 a ficha tinha 92px e o boneco cabia em 100px de
          altura — cabeça de 39px. Medido: a crista do moicano ficava com 24px e
          lia como coroa. Duas colunas dão 150px de boneco e 59px de cabeça.

          A versão intermediária tinha `sm:grid-cols-3`, e ela estava errada por
          um motivo que vale registrar: **`sm:` mede a JANELA, não o contêiner.**
          Num desktop de 1280 a coluna estreita do perfil recebia três colunas de
          108px para uma arte de 107px fixos — 0,8px de folga. O boneco tem
          largura em pixel (deriva do `viewBox`), então grade que se estreita sem
          o desenho estreitar junto é colisão esperando o primeiro monitor largo.

          O TETO É DA SEÇÃO, e é de 320px (`max-w-xs`), medido para caber duas
          fichas de ~150px em volta de uma arte de 107px de largura. A primeira
          tentativa pôs 448px e não resolveu nada: com duas colunas isso dá ficha
          de 220px e **56px de branco de cada lado do desenho** em 1280. Teto em
          grade não é teto em ficha — e a conta que importa é a segunda.

          Com 320px o seletor mede o mesmo em 375 e em 1280: ficha de ~150px,
          folga de 14 a 19px. O mesmo objeto nas duas pontas, que é o que
          "mobile-first a sério" quer dizer.

          O boneco continua de CORPO INTEIRO — 57% dele é o mesmo tronco nas seis
          fichas. O recorte de cabeça é do Bloco 6 (doc 15); forjá-lo aqui com um
          `overflow-hidden` de número chutado é o que a régua do projeto proíbe.
        */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {opcoes.map((o) => {
            const selecionado = o.slug === valor.hair;
            const bloqueado = nivel < o.minLevel;
            const chave = o.slug ?? "careca";

            return (
              <button
                key={chave}
                type="button"
                disabled={bloqueado}
                aria-pressed={selecionado}
                aria-label={
                  bloqueado
                    ? `${o.nome} — bloqueado, exige nível ${o.minLevel}`
                    : o.nome
                }
                onClick={() => aoMudar({ ...valor, hair: o.slug })}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 transition-colors",
                  FOCO,
                  // Marfim atrás do boneco na peça que é sua, branco na que ainda
                  // não é. Com as duas em marfim, livre e travada diferiam por
                  // 1px de tracejado e mais nada — invisível a distância normal
                  // de leitura. Superfície + traço são duas pistas, e nenhuma
                  // delas é cor: a "Colorblind Rule" continua de pé.
                  bloqueado ? "bg-white" : "bg-warm-stone",
                  // O travado é fio TRACEJADO, não peça apagada. Duas razões:
                  // com `opacity-55` no botão inteiro o cabelo preto do Chanel
                  // virava cinza e lia como "Grisalho" — que é uma das 8 cores
                  // logo abaixo —, e o "Nível 30" caía para 1,9:1 de contraste,
                  // atenuado duas vezes (ink/55 dentro de opacity-55). E, de
                  // produto: a peça travada é a que se quer desejar; mostrá-la
                  // desbotada vende o contrário. Tracejado é forma, não cor,
                  // então a "Colorblind Rule" continua atendida.
                  // O fio tem a MESMA tinta nos dois estados, e só o traço muda:
                  // com o travado em `ink/25` contra `ink/15` do livre, a opção
                  // que o aluno não pode ter era a de contorno mais forte da
                  // grade — o contrário do que ela precisa dizer.
                  bloqueado
                    ? "cursor-not-allowed border-dashed border-ink/25"
                    : selecionado
                      ? "border-gold bg-gold/10 ring-1 ring-gold"
                      : "border-ink/25 hover:border-gold/60"
                )}
              >
                <AvatarKokeshi
                  skin={valor.skin}
                  hair={o.slug}
                  hairColor={valor.hairColor}
                  altura={150}
                  ns={`cab-${chave}`}
                />
                <span className="text-sm font-semibold leading-tight">{o.nome}</span>
                {/* A linha de meta tem altura fixa: sem ela, as seis fichas
                    ficariam de alturas diferentes conforme quem está travado.

                    "Em uso" pesa MAIS que "Nível N", e a primeira versão tinha
                    isso ao contrário: o estado que o aluno não pode usar gritava
                    mais alto que o ativo. Tinta cheia para o que vale agora,
                    ink/70 para o que ainda não. Os dois passam AA a 11px. */}
                <span
                  className={cn(
                    "flex min-h-4 items-center gap-1 text-[11px]",
                    bloqueado ? "font-medium text-ink/70" : "font-semibold text-ink"
                  )}
                >
                  {bloqueado ? (
                    <>
                      <IconeCadeado />
                      Nível {o.minLevel}
                    </>
                  ) : selecionado ? (
                    <>
                      <IconeCheck />
                      Em uso
                    </>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <FileiraDeCores
        titulo="Cor do cabelo"
        cores={CABELO}
        nomes={NOMES_COR_CABELO}
        indice={valor.hairColor}
        aoEscolher={(i) => aoMudar({ ...valor, hairColor: i })}
        nota={
          valor.hair === null
            ? "A cor entra em cena quando você escolher um cabelo."
            : undefined
        }
      />

      <FileiraDeCores
        titulo="Tom de pele"
        cores={PELE}
        nomes={NOMES_PELE}
        indice={valor.skin}
        aoEscolher={(i) => aoMudar({ ...valor, skin: i })}
      />

      {/*
        A VITRINE FICA DEPOIS DA IDENTIDADE, e não em aba separada — por ora.

        O doc 21 §5.1 decidiu ABAS por slot (`Cabelo | Roupa | Rosto | Fundo | Pet`),
        e a decisão continua de pé: cinco slots empilhados num rolo comprido é o que
        ela existe para impedir. Mas hoje há **dois** grupos, e uma casca de abas
        para dois é mais cerimônia do que navegação — a criança pagaria um clique
        para ver o que cabe na mesma tela.

        A casca nasce no bloco do terceiro slot, que é quando ela passa a ganhar
        alguma coisa. Registrado aqui para não ser esquecido nem reinventado.

        A separação que JÁ existe é a que importa, e é do banco: a identidade sobe
        por `update_avatar_identity` no botão, a roupa por `equipar_peca` na hora.
      */}
      {trajes && aoTrocarTraje && (
        <Vitrine
          trajes={trajes}
          atual={traje ?? null}
          nivel={nivel}
          tier={tier}
          aoTrocar={aoTrocarTraje}
        />
      )}

      <div className="space-y-3">
        {erro && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-erro/40 bg-erro/5 px-3 py-2 text-sm text-ink"
          >
            <IconeAlerta className="mt-0.5 shrink-0 text-erro" />
            <span>{erro}</span>
          </p>
        )}
        <Button
          variant="primary"
          className="w-full"
          onClick={salvar}
          disabled={salvando}
        >
          {salvando ? "Salvando…" : rotuloAcao}
        </Button>
      </div>
    </div>
  );
}
