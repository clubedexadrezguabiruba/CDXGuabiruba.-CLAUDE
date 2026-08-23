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
 * O que a tela desenha travado vem de `avatar_catalogo` cruzado com
 * `avatar_guarda_roupa`, lidos no servidor. O cadeado é INFORMAÇÃO, não trava:
 * quem recusa é `equipar_peca`, que confere a POSSE dentro da transação (Regra
 * Inviolável nº 1). Editar o DOM para habilitar o botão continua batendo na
 * exceção da RPC, e a mensagem dela aparece no bloco de erro da vitrine.
 *
 * ⚠️ Até 2026-08-23 este parágrafo descrevia outra coisa, e vale dizer qual: o
 * cabelo tinha `min_level` lido de `avatar_hair_catalog`, e quem recusava era
 * `update_avatar_identity` comparando NÍVEL. Aquela gramática morreu inteira — a
 * tabela não existe mais, e a RPC de identidade parou de tocar no cabelo.
 *
 * A ausência de peça nunca é linha do catálogo: careca é `avatar_cabelo IS NULL`
 * e "sem traje" é `avatar_traje IS NULL`. As duas entram na vitrine na primeira
 * posição, e são sempre livres — nenhuma régua governa ausência.
 */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { AvatarKokeshi } from "@/components/avatar/AvatarKokeshi";
import { AvatarTronco } from "@/components/avatar/AvatarTronco";
import { AvatarCabeca } from "@/components/avatar/AvatarCabeca";
import { nomeDaPeca } from "@/lib/avatar/catalogo";
import { COR_DA_RARIDADE, NOME_DA_RARIDADE, type Raridade } from "@/lib/avatar/raridade";
import { CABELO, PELE } from "@/lib/avatar/palette";
import { cn } from "@/lib/cn";

/** As três colunas do Bloco C, na língua do banco: índice, slug, índice. */
export interface Aparencia {
  skin: number;
  hair: string | null;
  hairColor: number;
}

/**
 * Uma linha de `avatar_catalogo`, de QUALQUER slot, como a tela a lê no servidor.
 *
 * Chamava-se `TrajeDoCatalogo` e servia um slot só. Virou genérica em 2026-08-23,
 * quando o cabelo entrou no catálogo: a vitrine passou a servir três slots com a
 * mesma linha de banco, e um tipo por slot seria três cópias do mesmo shape.
 *
 * O aluno lê o catálogo INTEIRO, inclusive as peças que ainda não tem — é o que
 * permite a vitrine. Quem recusa é `equipar_peca`, não esta lista.
 */
export interface PecaDoCatalogo {
  slug: string;
  origem: "marco_nivel" | "marco_patente" | "bau";
  min_level: number | null;
  min_tier: number | null;
  raridade: Raridade | null;
  /** `true` se o aluno tem linha em `avatar_guarda_roupa` para este slug. */
  possui: boolean;
}

/** Os slots que a vitrine desenha. `chapeu` e `pet` entram nos blocos deles. */
export type SlotDaVitrine = "cabelo" | "traje" | "rosto";

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
  slot,
  titulo,
  rotuloSemPeca,
  pecas,
  atual,
  nivel,
  tier,
  aoTrocar,
  preview,
}: {
  /** Qual slot esta vitrine veste. Decide o nome da peça e a mensagem de erro. */
  slot: SlotDaVitrine;
  /** O rótulo do grupo: "Cabelo", "Roupa", "Rosto". */
  titulo: string;
  /** Como se chama a AUSÊNCIA de peça neste slot: "Careca", "Sem traje". */
  rotuloSemPeca: string;
  pecas: PecaDoCatalogo[];
  atual: string | null;
  nivel: number;
  tier: number;
  aoTrocar: (slug: string | null) => Promise<string | null>;
  /**
   * O boneco de cada ficha, e ele é DIFERENTE por slot — as duas medições que já
   * existem não se trocam sem o olho do Doug. Ver o docstring de cada chamador.
   */
  preview: (slug: string | null, chave: string) => React.ReactNode;
}) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // A ausência primeiro porque é o estado que nenhuma régua nega — careca e "sem
  // traje" são o mesmo objeto em slots diferentes. Depois o que o aluno pode usar,
  // e por último o que ele ainda deseja: a lista lida de cima para baixo é a
  // progressão.
  const podeUsar = (t: PecaDoCatalogo) =>
    t.origem === "bau"
      ? t.possui
      : t.origem === "marco_nivel"
        ? nivel >= (t.min_level ?? 1)
        : tier >= (t.min_tier ?? 0);

  const ordenados = [...pecas].sort((a, b) => {
    const d = Number(podeUsar(b)) - Number(podeUsar(a));
    return d !== 0 ? d : a.slug.localeCompare(b.slug);
  });

  const opcoes = [{ slug: null as string | null }, ...ordenados.map((t) => ({ slug: t.slug, t }))];

  async function escolher(slug: string | null) {
    if (ocupado) return;
    setOcupado(slug ?? `sem-${slot}`);
    setErro(null);
    const msg = await aoTrocar(slug);
    setOcupado(null);
    if (msg) setErro(msg);
  }

  return (
    <section className="max-w-xs">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className={TITULO_DE_GRUPO}>{titulo}</h3>
        <span className="truncate text-xs text-ink/70">
          {atual ? nomeDaPeca(slot, atual) : rotuloSemPeca}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {opcoes.map(({ slug, t }: { slug: string | null; t?: PecaDoCatalogo }) => {
          const selecionado = slug === atual;
          const livre = !t || podeUsar(t);
          const chave = slug ?? `sem-${slot}`;
          const nome = slug ? nomeDaPeca(slot, slug) : rotuloSemPeca;
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
                {preview(emSilhueta ? null : slug, chave)}
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
  cabelos,
  trajes,
  traje,
  rostos,
  rosto,
  aoTrocarPeca,
  nivel,
  tier = 0,
  rotuloAcao,
  aoSalvar,
  className,
}: {
  valor: Aparencia;
  aoMudar: (proxima: Aparencia) => void;
  /**
   * `avatar_catalogo` do slot cabelo, INTEIRO — inclusive o que o aluno não tem.
   *
   * Chamava-se `catalogo` e vinha de `avatar_hair_catalog`, com `min_level`. Desde
   * 2026-08-23 o cabelo é peça de baú como as outras, e a lista tem a mesma forma
   * das outras duas.
   */
  cabelos: PecaDoCatalogo[];
  /**
   * `avatar_catalogo` do slot traje, INTEIRO — inclusive o que o aluno não tem.
   * Ausente, o grupo "Roupa" não aparece: é o que mantém qualquer chamador antigo
   * idêntico ao de antes daquele bloco.
   */
  trajes?: PecaDoCatalogo[];
  /** `users.avatar_traje`. `null` é o macacão de treino — ausência de peça. */
  traje?: string | null;
  /**
   * `avatar_catalogo` do slot rosto. Ausente, o grupo "Rosto" não aparece.
   *
   * Ele fechou um buraco vivo: até 2026-08-23 o aluno podia GANHAR a
   * `rosto-barba-trancada` no baú e não tinha por onde vesti-la — `equipar_peca`
   * tinha 2 chamadores, os dois com `p_slot: "traje"`.
   */
  rostos?: PecaDoCatalogo[];
  /** `users.avatar_rosto`. `null` é rosto limpo. */
  rosto?: string | null;
  /**
   * Chama `equipar_peca` e devolve a MENSAGEM DE ERRO, ou `null` se deu certo.
   *
   * Recebe o SLOT porque a RPC recebe: ela é `equipar_peca(p_slot, p_slug)` desde
   * o B5, e um callback por slot seria três cópias da mesma chamada. A tela é quem
   * chama a RPC porque é ela quem repinta o palco: o editor não tem boneco grande
   * de propósito (ver o docstring do topo).
   */
  aoTrocarPeca?: (slot: SlotDaVitrine, slug: string | null) => Promise<string | null>;
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

  async function salvar() {
    if (salvando) return;
    setSalvando(true);
    setErro(null);

    // O CABELO SAIU DAQUI em 2026-08-23. Ele é peça de `avatar_catalogo` e se veste
    // por `equipar_peca`, na hora, como o traje — a RPC de identidade ficou com o
    // que de fato é identidade e não é peça: as duas cores que o aluno escolhe
    // (emenda à D27). Ver o docstring de <Vitrine> sobre a assimetria.
    const supabase = createClient();
    const { error } = await supabase.rpc("update_avatar_identity", {
      p_skin: valor.skin,
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
      {/*
        O CABELO É UMA VITRINE COMO AS OUTRAS desde 2026-08-23.

        Ele tinha grade própria, com cadeado de NÍVEL lido de `avatar_hair_catalog`.
        Agora é peça de baú: o cadeado é de POSSE, a peça não possuída sai em
        silhueta com a cor e o nome da raridade, e quem recusa continua sendo o
        servidor — `equipar_peca`, que cobra a linha no guarda-roupa.

        ⚠️ O PREVIEW PRESERVA A MEDIÇÃO QUE JÁ EXISTIA, e ela não se troca sem o
        olho do Doug: `<AvatarKokeshi altura={150}>` em grade de DUAS colunas. Com
        três colunas em 375px a ficha tinha 92px, o boneco cabia em 100px de altura
        (cabeça de 39px) e a crista do moicano ficava com 24px — medido, lia como
        coroa. Duas colunas dão 150px de boneco e 59px de cabeça. O teto de 320px da
        seção (`max-w-xs`) é o que faz o seletor medir o mesmo em 375 e em 1280.

        O boneco continua de CORPO INTEIRO — 57% dele é o mesmo tronco nas fichas. O
        recorte de cabeça é do Bloco 6 (doc 15); forjá-lo aqui com um
        `overflow-hidden` de número chutado é o que a régua do projeto proíbe.
      */}
      {aoTrocarPeca && (
        <Vitrine
          slot="cabelo"
          titulo="Cabelo"
          rotuloSemPeca="Careca"
          pecas={cabelos}
          atual={valor.hair}
          nivel={nivel}
          tier={tier}
          aoTrocar={(slug) => aoTrocarPeca("cabelo", slug)}
          preview={(slug, chave) => (
            <AvatarKokeshi
              skin={valor.skin}
              hair={slug}
              hairColor={valor.hairColor}
              altura={150}
              ns={`cab-${chave}`}
            />
          )}
        />
      )}

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
        AS VITRINES FICAM DEPOIS DA IDENTIDADE, e não em abas — por ora, e a decisão
        de não juntar é desta data.

        O doc 21 §5.1 decidiu ABAS por slot (`Cabelo | Roupa | Rosto | Fundo | Pet`),
        e a decisão continua de pé. Este comentário dizia, até 2026-08-23, que "a
        casca nasce no bloco do terceiro slot" — e este bloco criou o terceiro E o
        quarto grupo, então o gatilho disparou. **Não se juntou de propósito:** três
        vitrines empilhadas deixam `/perfil` LONGO, não quebrado, e abas é decisão
        visual (`design-recruta64`) que merece bloco próprio com o parecer do Doug.
        Encurtar a tela por conta própria seria decidir por ele.

        A separação que JÁ existe é a que importa, e é do banco: a identidade sobe
        por `update_avatar_identity` no botão, a peça por `equipar_peca` na hora.
      */}
      {trajes && aoTrocarPeca && (
        <Vitrine
          slot="traje"
          titulo="Roupa"
          rotuloSemPeca="Sem traje"
          pecas={trajes}
          atual={traje ?? null}
          nivel={nivel}
          tier={tier}
          aoTrocar={(slug) => aoTrocarPeca("traje", slug)}
          // ⚠️ A medição do traje: `<AvatarTronco altura={96}>`, sem cabelo e com
          // pele fixa em 2. É o tronco que a peça veste — desenhar a cabeça aqui
          // gastaria altura de ficha no que a peça não muda.
          preview={(slug, chave) => (
            <AvatarTronco
              skin={2}
              hair={null}
              hairColor={0}
              traje={slug}
              altura={96}
              ns={`vit-${chave}`}
            />
          )}
        />
      )}

      {rostos && aoTrocarPeca && (
        <Vitrine
          slot="rosto"
          titulo="Rosto"
          rotuloSemPeca="Sem barba"
          pecas={rostos}
          atual={rosto ?? null}
          nivel={nivel}
          tier={tier}
          aoTrocar={(slug) => aoTrocarPeca("rosto", slug)}
          // A peça de rosto é a única cujo preview PRECISA da identidade: a barba
          // recolore com o cabelo (D17), então uma ficha de pele e cor fixas
          // mostraria uma cor que o aluno não vai ver. `<AvatarCabeca>` recorta na
          // cabeça, que é onde a peça inteira mora.
          preview={(slug, chave) => (
            <AvatarCabeca
              skin={valor.skin}
              hair={valor.hair}
              hairColor={valor.hairColor}
              rosto={slug}
              lado={96}
              ns={`ros-${chave}`}
            />
          )}
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
