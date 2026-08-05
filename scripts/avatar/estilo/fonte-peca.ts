/**
 * O CONTRATO DA FONTE SEMÂNTICA — ler `semantica.svg` e dizer se ele é peça.
 *
 * Este arquivo não desenha, não mede e não rasteriza. Ele responde uma pergunta
 * só: *o arquivo que a curadoria produziu é legível e está completo?*
 *
 * ---------------------------------------------------------------------------
 * POR QUE UMA FONTE SEMÂNTICA, E POR QUE ELA É VERSIONADA
 * ---------------------------------------------------------------------------
 *
 * A rota antiga adivinha a peça a partir de pixels: filtra o teal, acha as
 * componentes conexas, e **fica com a maior** (`gruposTeal[0]`). O que sobra é
 * impresso num log e nunca reprova nada. Uma cortina solta do penteado — que é
 * uma componente separada, porque a arte desenha um vão entre ela e o volume — é
 * silenciosamente descartada, e todos os gates continuam verdes.
 *
 * Aqui a peça não é adivinhada: ela é **declarada**, path a path, num arquivo
 * versionado. E o que não foi declarado não é ignorado — é **reprovado**. É a
 * diferença entre "o algoritmo achou 79% da massa" e "faltam 3 paths, e são estes".
 *
 * O insumo antigo mora em `.scratch/`, que o git ignora. Este mora em
 * `scripts/avatar/fonte/`, ao lado da arte que o originou.
 *
 * ---------------------------------------------------------------------------
 * O RÓTULO VAI NO `<path>`, NUNCA EM `<g>`
 * ---------------------------------------------------------------------------
 *
 * `fonte-svg.ts` lança em qualquer `<g>`, e a razão está escrita lá: um
 * `transform` de grupo exigiria compor matriz, e nenhuma coordenada seria
 * confiável sem isso. Agrupar seria mais legível para um humano — e ninguém lê
 * 437 paths a olho, o arquivo é gerado por script. O que se ganharia em leitura
 * se pagaria em três regras novas (proibir `transform`, proibir aninhamento,
 * proibir `<use>`) para resolver um problema que a outra forma **não cria**.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO NÃO PEGA, E É DE PROPÓSITO
 * ---------------------------------------------------------------------------
 *
 * **Rótulo plausível mas errado.** Marcar a silhueta da cabeça como `massa`
 * produz um arquivo perfeitamente legal: um path fechado, com papel, com tinta,
 * reclamado uma vez. Nenhuma contabilidade de conjunto acusa isso.
 *
 * Tentei uma regra exata para ele — "nenhuma camada pode reclamar o subpath que
 * contém todos os outros" — e ela é **vazia nesta arte**: o conversor parte a
 * figura em cabeça (185 mil u², centro y=270) e tronco (98 mil, centro y=670), e
 * nenhum dos dois contém o outro. Um teto de área resolveria, e um teto calibrado
 * na peça que se quer aprovar aprova o defeito junto. Então fica declarado: quem
 * pega rótulo errado é a **folha**, e a trava de silhueta do runtime.
 */

import { readFileSync } from "fs";
import {
  acharSubpaths,
  eSignificativo,
  lerSvg,
  type Caixa,
  type PathSvg,
  type Subpath,
} from "./fonte-svg";

/* ------------------------------------------------------------------ */
/* Os papéis                                                           */
/* ------------------------------------------------------------------ */

/** Os papéis que viram camada — os que pintam. */
export const PAPEIS_DE_PECA = ["massa", "tom-claro", "linha-mascara", "extensao"] as const;
/** Os dois que não pintam: `guia` some, `descarte` conta na completude. */
export const PAPEIS_SEM_TINTA = ["guia", "descarte"] as const;
export const PAPEIS = [...PAPEIS_DE_PECA, ...PAPEIS_SEM_TINTA] as const;

export type PapelDePeca = (typeof PAPEIS_DE_PECA)[number];
export type Papel = (typeof PAPEIS)[number];

export const PLANOS = ["atras", "frente"] as const;
export type Plano = (typeof PLANOS)[number];

export interface CamadaFonte {
  papel: PapelDePeca;
  /** O token de tinta. Cabelo: `cabelo` / `cabelo-s` / `linha`. Traje: a patente. */
  paint: string;
  plano?: Plano;
  grupo?: string;
  subpaths: Subpath[];
  caixa: Caixa;
  /** Soma das áreas absolutas. */
  area: number;
}

/**
 * UMA GUIA — geometria que NÃO é a peça, e que a peça precisa para se situar.
 *
 * A única de hoje é `cabeca`: a silhueta da cabeça do boneco do gerador, que é o
 * marco de registro da importação. Ela não pinta nada e não pode pintar; o que ela
 * faz é dizer **onde a cabeça está na arte**, para a peça ser colocada contra o
 * crânio do produto em vez de contra o tronco dele.
 *
 * É declarada, e não achada, pela mesma razão que o resto: um marco inferido por
 * heurística some no dia em que a heurística erra, e some calado.
 */
export interface Guia {
  nome: string;
  subpaths: Subpath[];
  caixa: Caixa;
  area: number;
}

export interface FontePeca {
  arquivo: string;
  viewBox: { w: number; h: number };
  camadas: CamadaFonte[];
  descartes: { motivo: string; subpaths: Subpath[]; area: number }[];
  guias: Guia[];
  /** Todo subpath significativo, com o dono que o reclamou. */
  significativos: { id: string; papel: Papel; path: number; subpath: Subpath }[];
}

export interface Leitura {
  peca: FontePeca | null;
  falhas: string[];
  laudo: string[];
}

/* ------------------------------------------------------------------ */
/* Identidade                                                          */
/* ------------------------------------------------------------------ */

/**
 * A IDENTIDADE DE UM SUBPATH — NUNCA POR ÍNDICE.
 *
 * O próprio `fonte-svg.ts` já aprendeu isso para a moldura: *"o conversor não
 * promete ordem"*. Se a identidade fosse o índice, reordenar os paths — coisa que
 * qualquer passagem por editor faz — trocaria os donos em silêncio.
 *
 * É o `d` normalizado, mais área e caixa arredondadas. O `d` sozinho bastaria;
 * área e caixa entram porque uma colisão de hash com geometria diferente vira
 * discordância visível em vez de troca calada. Medido no A0: **235 identidades
 * distintas para 235 subpaths significativos, zero colisões.**
 */
export function identidadeDoSubpath(s: Subpath): string {
  const d = s.d.replace(/\s+/g, " ").trim();
  const cx = `${s.caixa.x0.toFixed(2)},${s.caixa.y0.toFixed(2)},${s.caixa.x1.toFixed(2)},${s.caixa.y1.toFixed(2)}`;
  return `${hash(d)}·${Math.abs(s.area).toFixed(1)}·${hash(cx)}`;
}

/** FNV-1a de 32 bits, duas vezes com sementes distintas. Não é criptografia. */
function hash(s: string): string {
  let a = 0x811c9dc5;
  let b = 0x7fed7fed;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619) >>> 0;
    b = Math.imul(b + c, 2654435761) >>> 0;
  }
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}

/* ------------------------------------------------------------------ */
/* A leitura com contrato                                              */
/* ------------------------------------------------------------------ */

const ehPapel = (v: string | undefined): v is Papel => !!v && (PAPEIS as readonly string[]).includes(v);
const ehPapelDePeca = (v: Papel): v is PapelDePeca =>
  (PAPEIS_DE_PECA as readonly string[]).includes(v);

/**
 * LÊ E CONFERE. Devolve as falhas em vez de lançar na primeira.
 *
 * Lançar na primeira falha faz a curadoria consertar 235 paths um por rodada.
 * Uma lista inteira é uma rodada só. Quem lança é `lerFontePecaOuFalhar`.
 */
export function lerFontePeca(caminho: string): Leitura {
  const falhas: string[] = [];
  const laudo: string[] = [];

  let svg: ReturnType<typeof lerSvg>;
  try {
    svg = lerSvg(caminho);
  } catch (e) {
    return { peca: null, falhas: [`${(e as Error).message}`], laudo };
  }

  const vb = svg.vb;
  const camadas = new Map<string, CamadaFonte>();
  const descartes = new Map<string, { motivo: string; subpaths: Subpath[]; area: number }>();
  const guias = new Map<string, Guia>();
  const significativos: FontePeca["significativos"] = [];
  const donos = new Map<string, { papel: Papel; path: number }[]>();

  const juntarCaixa = (a: Caixa, s: Subpath): Caixa => ({
    x0: Math.min(a.x0, s.caixa.x0),
    y0: Math.min(a.y0, s.caixa.y0),
    x1: Math.max(a.x1, s.caixa.x1),
    y1: Math.max(a.y1, s.caixa.y1),
  });
  const VAZIA: Caixa = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };

  for (const p of svg.paths) {
    const uteis = p.subpaths.filter((s) => eSignificativo(s, vb));
    const papelCru = p.rotulo.papel;

    // A moldura não pode ser peça. Ela é o retângulo do canvas e reclamá-la
    // pintaria o quadro inteiro de cabelo.
    const molduras = p.subpaths.filter((s) => s.eMoldura);
    if (molduras.length && ehPapel(papelCru) && ehPapelDePeca(papelCru)) {
      falhas.push(
        `path #${p.i}: papel "${papelCru}" numa moldura (${molduras.length} subpath(s) com ≥95% do viewBox). ` +
          `Moldura é \`descarte\` ou não tem papel.`,
      );
    }

    if (!uteis.length) continue;

    if (papelCru === undefined) {
      falhas.push(
        `path #${p.i}: ${uteis.length} subpath(s) significativo(s) sem \`data-avatar-role\`. ` +
          `Todo path significativo precisa de dono — \`descarte\` com motivo também é dono.`,
      );
      continue;
    }
    if (!ehPapel(papelCru)) {
      falhas.push(`path #${p.i}: papel "${papelCru}" desconhecido. Conhecidos: ${PAPEIS.join(", ")}.`);
      continue;
    }
    const papel: Papel = papelCru;

    for (const s of uteis) {
      const id = identidadeDoSubpath(s);
      significativos.push({ id, papel, path: p.i, subpath: s });
      donos.set(id, [...(donos.get(id) ?? []), { papel, path: p.i }]);
    }

    if (papel === "guia") {
      // O nome da guia vai em `data-avatar-grupo`, o mesmo atributo que junta
      // subpaths de uma extensão. Não é reaproveitamento por economia: nos dois
      // casos ele responde à mesma pergunta — *de que coisa este path faz parte?*
      const nome = p.rotulo.grupo;
      if (!nome) {
        falhas.push(
          `path #${p.i}: \`guia\` sem \`data-avatar-grupo\`. Guia anônima não serve de marco — ` +
            `quem importa precisa pedir a guia PELO NOME (hoje: "cabeca").`,
        );
        continue;
      }
      const g = guias.get(nome) ?? { nome, subpaths: [], caixa: VAZIA, area: 0 };
      for (const s of uteis) {
        g.subpaths.push(s);
        g.area += Math.abs(s.area);
        g.caixa = juntarCaixa(g.caixa, s);
      }
      guias.set(nome, g);
      continue;
    }

    if (papel === "descarte") {
      const motivo = p.rotulo.motivo;
      if (!motivo) {
        falhas.push(
          `path #${p.i}: \`descarte\` sem \`data-motivo\`. Descarte sem motivo é o buraco ` +
            `que este pipeline existe para fechar — escreva o que é.`,
        );
        continue;
      }
      const d = descartes.get(motivo) ?? { motivo, subpaths: [], area: 0 };
      d.subpaths.push(...uteis);
      d.area += uteis.reduce((a, s) => a + Math.abs(s.area), 0);
      descartes.set(motivo, d);
      continue;
    }

    // Daqui para baixo, papel de peça.
    const abertos = uteis.filter((s) => !s.fechado);
    if (abertos.length) {
      falhas.push(
        `path #${p.i}: papel "${papel}" com ${abertos.length} subpath(s) ABERTO(s). ` +
          `A fonte traça tinta como região fechada — a linha de centro é produto do ` +
          `importador, não da fonte.`,
      );
    }

    const paint = p.rotulo.paint;
    if (!paint) {
      falhas.push(`path #${p.i}: papel "${papel}" sem \`data-avatar-paint\`. Todo papel que pinta declara a tinta.`);
      continue;
    }

    let plano: Plano | undefined;
    if (papel === "extensao") {
      const cru = p.rotulo.plano;
      if (!cru) {
        falhas.push(
          `path #${p.i}: \`extensao\` sem \`data-plano\`. Sem plano o compositor não sabe ` +
            `se a mecha passa atrás ou na frente da cabeça.`,
        );
        continue;
      }
      if (!(PLANOS as readonly string[]).includes(cru)) {
        falhas.push(`path #${p.i}: \`data-plano="${cru}"\` desconhecido. Conhecidos: ${PLANOS.join(", ")}.`);
        continue;
      }
      plano = cru as Plano;
    } else if (p.rotulo.plano) {
      falhas.push(`path #${p.i}: papel "${papel}" com \`data-plano\`, que só vale em \`extensao\`.`);
    }

    // A chave da camada: papel + tinta + plano + grupo. Dois paths com a mesma
    // chave são a mesma camada partida em pedaços, que é o normal — o conversor
    // fragmenta tudo.
    const grupo = p.rotulo.grupo;
    const chave = [papel, paint, plano ?? "", grupo ?? ""].join("|");
    const c =
      camadas.get(chave) ??
      ({ papel, paint, plano, grupo, subpaths: [], area: 0, caixa: VAZIA } as CamadaFonte);
    for (const s of uteis) {
      c.subpaths.push(s);
      c.area += Math.abs(s.area);
      c.caixa = juntarCaixa(c.caixa, s);
    }
    camadas.set(chave, c);
  }

  // Dois donos para o mesmo subpath. Com o rótulo no `<path>` isso não acontece
  // por sintaxe — acontece quando a curadoria DUPLICA um path e rotula os dois.
  for (const [id, ds] of donos) {
    if (ds.length > 1) {
      falhas.push(
        `subpath ${id.slice(0, 12)}…: reclamado por ${ds.length} paths ` +
          `(#${ds.map((d) => `${d.path} como ${d.papel}`).join(", #")}). Exatamente um dono.`,
      );
    }
  }

  const peca: FontePeca = {
    arquivo: caminho,
    viewBox: vb,
    camadas: [...camadas.values()],
    descartes: [...descartes.values()],
    guias: [...guias.values()],
    significativos,
  };

  laudo.push(`fonte semântica · ${caminho}`);
  laudo.push(
    `  ${svg.paths.length} paths · ${significativos.length} subpaths significativos · ` +
      `${peca.camadas.length} camada(s) · ${peca.descartes.length} motivo(s) de descarte · ` +
      `${peca.guias.length} guia(s)`,
  );
  for (const g of peca.guias) {
    laudo.push(
      `  guia "${g.nome}" · ${g.subpaths.length} subpaths · ${g.area.toFixed(0)} u² · ` +
        `caixa (${g.caixa.x0.toFixed(0)},${g.caixa.y0.toFixed(0)})-(${g.caixa.x1.toFixed(0)},${g.caixa.y1.toFixed(0)})`,
    );
  }
  for (const c of [...peca.camadas].sort((a, b) => b.area - a.area)) {
    laudo.push(
      `  ${c.papel.padEnd(13)} ${c.paint.padEnd(10)}${(c.plano ?? "").padEnd(7)}${(c.grupo ?? "").padEnd(14)}` +
        `${String(c.subpaths.length).padStart(4)} subpaths · ${c.area.toFixed(0).padStart(7)} u²`,
    );
  }
  for (const d of [...peca.descartes].sort((a, b) => b.area - a.area)) {
    laudo.push(`  descarte      ${d.subpaths.length} subpaths · ${d.area.toFixed(0).padStart(7)} u² · "${d.motivo}"`);
  }

  return { peca: falhas.length ? null : peca, falhas, laudo };
}

/**
 * A GUIA PELO NOME, ou um erro que diz o que fazer.
 *
 * Devolver `undefined` faria a importação seguir sem marco de registro e cair 28%
 * fora do crânio em silêncio — que é exatamente o defeito que a guia existe para
 * impedir. Um marco ausente é motivo para parar, não para continuar no escuro.
 */
export function guiaChamada(peca: FontePeca, nome: string): Guia {
  const g = peca.guias.find((g) => g.nome === nome);
  if (!g) {
    throw new Error(
      `${peca.arquivo}: não há guia "${nome}". Sem ela a peça é registrada pelos marcos do ` +
        `CORPO, e a cabeça do gerador não tem a proporção do \`geometria.ts\` — medido, ` +
        `28% de erro de escala. Marque a silhueta da cabeça com ` +
        `data-avatar-role="guia" data-avatar-grupo="${nome}".`,
    );
  }
  return g;
}

export function lerFontePecaOuFalhar(caminho: string): FontePeca {
  const { peca, falhas } = lerFontePeca(caminho);
  if (!peca) throw new Error(`${caminho}: contrato reprovado\n  - ${falhas.join("\n  - ")}`);
  return peca;
}

/* ------------------------------------------------------------------ */
/* Completude estrutural — contra a origem                             */
/* ------------------------------------------------------------------ */

/**
 * A CURADORIA PERDEU PATH? — contabilidade de conjunto, sem teto nenhum.
 *
 * O `semantica.svg` nasce do `origem.svg` acrescentando atributos. Então os dois
 * têm de ter **o mesmo conjunto de subpaths significativos**, e a diferença tem
 * exatamente dois nomes: o que sumiu (a cortina apagada em vez de rotulada) e o
 * que apareceu do nada (geometria inventada na curadoria, que a referência não
 * tem para conferir).
 *
 * **Aqui eu divirjo do plano em uma linha, e digo por quê.** Ele escreve que o
 * `origem.svg` fica congelado *"para permitir refazer a curadoria do zero — não é
 * insumo do build"*. Continua não sendo do build: quem importa lê só a semântica.
 * Mas a fixture que o próprio plano exige — *"`cortina-solta`: remover a cortina
 * da fonte deixa vermelho"* — **não tem como ficar vermelha** dentro de um arquivo
 * auto-contido: apagar um path de lá não deixa rastro nenhum. Ou o gate lê a
 * origem, ou a fixture não existe.
 */
export function conferirCompletude(
  caminhoSemantica: string,
  caminhoOrigem: string,
): { falhas: string[]; laudo: string[] } {
  const falhas: string[] = [];
  const origem = lerSvg(caminhoOrigem);
  const semantica = lerSvg(caminhoSemantica);

  const idsDe = (svg: ReturnType<typeof lerSvg>) => {
    const m = new Map<string, number>();
    for (const p of svg.paths) {
      for (const s of p.subpaths) {
        if (!eSignificativo(s, svg.vb)) continue;
        const id = identidadeDoSubpath(s);
        m.set(id, (m.get(id) ?? 0) + 1);
      }
    }
    return m;
  };

  if (origem.vb.w !== semantica.vb.w || origem.vb.h !== semantica.vb.h) {
    falhas.push(
      `viewBox difere: origem ${origem.vb.w}×${origem.vb.h}, semântica ` +
        `${semantica.vb.w}×${semantica.vb.h}. Nenhuma coordenada é comparável.`,
    );
    return { falhas, laudo: [] };
  }

  const a = idsDe(origem);
  const b = idsDe(semantica);

  const sumiram = [...a.keys()].filter((id) => !b.has(id));
  const surgiram = [...b.keys()].filter((id) => !a.has(id));
  for (const id of sumiram) {
    const s = origem.paths.flatMap((p) => p.subpaths).find((s) => identidadeDoSubpath(s) === id)!;
    falhas.push(
      `sumiu da semântica: subpath ${id.slice(0, 12)}… · ${Math.abs(s.area).toFixed(0)} u² · ` +
        `caixa (${s.caixa.x0.toFixed(0)},${s.caixa.y0.toFixed(0)})-(${s.caixa.x1.toFixed(0)},${s.caixa.y1.toFixed(0)}). ` +
        `Path que a origem tem e a curadoria não rotulou — apagar não é rotular.`,
    );
  }
  for (const id of surgiram) {
    falhas.push(`surgiu na semântica: subpath ${id.slice(0, 12)}…, que a origem não tem. Geometria sem referência.`);
  }

  return {
    falhas,
    laudo: [
      `completude estrutural · ${a.size} subpaths significativos na origem · ${b.size} na semântica`,
      `  sumiram ${sumiram.length} · surgiram ${surgiram.length}`,
    ],
  };
}

/**
 * OS NÓS QUE ESTÃO SOBRE A CURVA — o `M` e o ponto final de cada `C`.
 *
 * Os dois pontos de controle de uma Bézier ficam FORA dela, então incluí-los
 * empurraria a caixa e a contagem para fora da tinta. O repertório é `M C z`, e só
 * — medido no A0 sobre os 437 paths.
 */
export function nosDoSubpath(s: Subpath): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const t = s.d.match(/[MC]|-?\d*\.?\d+/g) ?? [];
  for (let i = 0; i < t.length; ) {
    if (t[i] === "M") {
      pts.push({ x: Number(t[i + 1]), y: Number(t[i + 2]) });
      i += 3;
    } else if (t[i] === "C") {
      pts.push({ x: Number(t[i + 5]), y: Number(t[i + 6]) });
      i += 7;
    } else i++;
  }
  return pts;
}

/* ------------------------------------------------------------------ */
/* Remontagem por camada                                               */
/* ------------------------------------------------------------------ */

/**
 * UM `<svg>` COM SÓ UMA CAMADA — o cabeçalho intacto, então a posição é a mesma.
 *
 * É a técnica de `svgDaFamilia`, com uma diferença que vale a duplicação: aqui
 * cada **subpath** vira um `<path>` sólido próprio, sem enrolamento a cancelar.
 * Lá o `d` ia inteiro porque a moldura era o que esvaziava o miolo; aqui a
 * moldura nunca entra numa camada — o contrato reprova.
 */
export function svgDaCamada(caminho: string, subpaths: Subpath[]): string {
  const src = readFileSync(caminho, "utf8");
  const corte = src.indexOf("<path");
  const cabecalho = src.slice(0, corte);
  const corpo = subpaths.map((s) => `<path fill="#000000" stroke="none" d="${s.d}"/>`).join("");
  return `${cabecalho}${corpo}</svg>`;
}

/** Reexportado para quem monta fixture sem passar por arquivo. */
export { acharSubpaths, eSignificativo };
export type { PathSvg, Subpath };
