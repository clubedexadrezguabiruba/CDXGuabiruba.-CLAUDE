/**
 * A ASSINATURA COMUM DAS ROTAS DE TRAÇADO — e o que se mede sobre elas.
 *
 * Uma **rota** responde uma pergunta só: *dada a máscara congelada, quais são os
 * contornos dela, em pontos?* Não recolore, não registra na cabeça, não decima e não
 * emite peça — isso é dos blocos seguintes. Ela para no contorno, e é por isso que
 * duas rotas podem ser comparadas: o que muda entre elas é a geometria devolvida, e
 * mais nada.
 *
 * ---------------------------------------------------------------------------
 * PONTO É O FORMATO-ALVO, E NÃO UMA PERDA
 * ---------------------------------------------------------------------------
 *
 * A objeção óbvia contra o `potrace` é que o backend dele devolve **segmentos
 * retos**. Neste repositório isso se inverte: `Cabelo.massa` é uma **lista de
 * pontos**, não uma curva — quem gera a curva é o `spline()` de `cabelo.ts`, no
 * momento de emitir o `d`. O tipo nem tem campo `d`: ele foi removido de propósito,
 * porque dado guardado como dado é dado que o gate consegue medir.
 *
 * Então as duas rotas terminam no mesmo lugar, e o achatador é **um**: o
 * `acharSubpaths` de `fonte-svg.ts`, que já devolve a poligonal de que a área e a
 * caixa saíam. Dois achatadores com `SEGMENTOS` diferentes fariam duas medições da
 * mesma forma discordar por um motivo que não é a forma.
 *
 * ---------------------------------------------------------------------------
 * O ESPAÇO É O PIXEL DA MÁSCARA, DO PRIMEIRO AO ÚLTIMO PONTO
 * ---------------------------------------------------------------------------
 *
 * Toda rota devolve coordenada em pixel do raster da máscara congelada. É o espaço
 * em que a máscara existe, é o espaço que o `potrace` fala nativamente, e é o único
 * em que a conferência pode rasterizar de volta 1:1 — reamostrar no meio
 * introduziria uma rampa que a régua leria como desvio de traçado.
 */

import { acharSubpaths } from "../fonte-svg";
import type { MascaraCongelada } from "../mascara";
import { rasterizarSvg } from "../raster";
import { conexas } from "../tracar-cabelo";

export interface Contorno {
  /** Em pixel do raster da máscara. */
  pts: { x: number; y: number }[];
  /** Área com sinal: o sinal separa contorno externo de buraco. */
  area: number;
}

export interface Tracado {
  rota: string;
  /** O hash da máscara de que este traçado saiu. Se ele mudar, o traçado é outro. */
  hashDaMascara: string;
  /** Ordenados por área absoluta, o maior primeiro. */
  contornos: Contorno[];
  /** Soma dos pontos de todos os contornos. */
  pontos: number;
  laudo: string[];
}

export interface OpcoesRota {
  /** O arquivo de entrada, para as rotas que não partem da máscara (line-art). */
  arquivo?: string;
  /** Sobrescritas de parâmetro, por nome. Cada rota documenta os seus. */
  [k: string]: string | number | boolean | undefined;
}

export interface Rota {
  nome: string;
  /** Uma linha dizendo de onde a geometria vem. Vai para o cabeçalho da conferência. */
  origem: string;
  tracar(mc: MascaraCongelada, opcoes?: OpcoesRota): Promise<Tracado>;
}

/**
 * UM `d` VIRANDO CONTORNOS — o achatador de `fonte-svg.ts`, sem um segundo ao lado.
 *
 * `eMoldura` sai `false` aqui e é ignorado: não há moldura de canvas num traçado de
 * máscara. O que existe é buraco, e buraco se reconhece pelo **sinal da área**, que
 * `acharSubpaths` já devolve.
 */
export function contornosDoD(d: string, ondeErro: string): Contorno[] {
  return acharSubpaths(d, ondeErro)
    .map((s) => ({ pts: s.pts, area: s.area }))
    .sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
}

/** O SVG de um traçado, no tamanho exato da máscara. `evenodd` porque há buraco. */
export function svgDoTracado(t: Tracado, w: number, h: number): string {
  const d = t.contornos
    .map((c) => `M${c.pts.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join("L")}z`)
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<path fill="#000000" fill-rule="evenodd" stroke="none" d="${d}"/></svg>`
  );
}

/**
 * O TRAÇADO DE VOLTA A MÁSCARA — 1:1, e é isto que a conferência compara.
 *
 * A pergunta do bloco 0 é *a curva devolvida descreve a mesma região que a máscara
 * de onde ela saiu?*, e a única forma de perguntá-la sem um render no meio é
 * rasterizar o contorno no mesmo tamanho e comparar região com região. `rasterizarSvg`
 * é a mesma que o resto da régua usa, e a altura pedida é a da própria máscara.
 */
export async function mascaraDoTracado(
  t: Tracado,
  w: number,
  h: number,
): Promise<{ mask: Uint8Array; w: number; h: number }> {
  const bmp = await rasterizarSvg(svgDoTracado(t, w, h), h);
  const mask = new Uint8Array(bmp.w * bmp.h);
  for (let i = 0; i < mask.length; i++) {
    const j = i * bmp.canais;
    // Preto sobre branco: o limiar do meio serve, e não há tom intermediário além
    // da rampa de um pixel do próprio rasterizador.
    const l = 0.2126 * bmp.data[j] + 0.7152 * bmp.data[j + 1] + 0.0722 * bmp.data[j + 2];
    if (l < 128) mask[i] = 1;
  }
  return { mask, w: bmp.w, h: bmp.h };
}

/** Componentes desconectados de uma máscara, em % da maior. A primeira é sempre 100. */
export function ilhasDe(mask: Uint8Array, w: number, h: number): number[] {
  const g = conexas(mask, w, h);
  return g.map((c) => (100 * c.length) / (g[0]?.length || 1));
}

/* ------------------------------------------------------------------ */
/* As pontas — conhecidas, e portanto mensuráveis uma a uma            */
/* ------------------------------------------------------------------ */

/**
 * AS PONTAS DA COROA, ACHADAS NA PRÓPRIA MÁSCARA.
 *
 * A folha reprovada tem três reclamações, e duas delas vivem nas ~12 pontas do alto.
 * "Preservação das pontas" só é um número se as pontas tiverem endereço — e elas
 * têm: cada uma é um **máximo local da borda de cima**, coluna a coluna.
 *
 * A proeminência exigida é **um traço** (12 unidades do produto, convertidas ao pixel
 * desta máscara), e não um número escolhido: abaixo de um traço o bico não sobrevive
 * ao próprio traço com que o produto o desenharia, e a 56 px ele mede 0,96 pixel. Um
 * pico menor que isso não é ponta, é serrilhado da borda.
 */
export interface Ponta {
  /** Coluna do pixel da máscara. */
  x: number;
  /** A linha mais alta com massa naquela coluna. */
  y: number;
  /** Quanto o bico sobe acima do maior dos dois vales vizinhos, em pixel. */
  proeminencia: number;
}

export function pontasDaMascara(
  mc: MascaraCongelada,
  proeminenciaU = 12,
): { pontas: Ponta[]; topo: (number | null)[] } {
  const topo: (number | null)[] = new Array(mc.w).fill(null);
  for (let y = 0; y < mc.h; y++) {
    for (let x = 0; x < mc.w; x++) {
      if (!mc.mask[y * mc.w + x]) continue;
      if (topo[x] === null) topo[x] = y;
    }
  }

  const minProem = proeminenciaU / mc.mapa.kx;
  const pontas: Ponta[] = [];
  const xs = topo.map((v, x) => ({ v, x })).filter((c) => c.v !== null) as { v: number; x: number }[];
  if (xs.length < 3) return { pontas, topo };

  for (let k = 1; k < xs.length - 1; k++) {
    // Pico: nenhum vizinho imediato mais alto, e estritamente mais alto que um deles.
    if (!(xs[k].v <= xs[k - 1].v && xs[k].v <= xs[k + 1].v)) continue;
    if (xs[k].v === xs[k - 1].v && xs[k].v === xs[k + 1].v) continue;

    // Proeminência: desce dos dois lados até achar coluna mais alta que este pico, e
    // o vale relevante é o MAIOR dos dois mínimos — a definição topográfica.
    let valeEsq = xs[k].v;
    for (let j = k - 1; j >= 0; j--) {
      if (xs[j].v < xs[k].v) break;
      valeEsq = Math.max(valeEsq, xs[j].v);
    }
    let valeDir = xs[k].v;
    for (let j = k + 1; j < xs.length; j++) {
      if (xs[j].v < xs[k].v) break;
      valeDir = Math.max(valeDir, xs[j].v);
    }
    const proeminencia = Math.min(valeEsq, valeDir) - xs[k].v;
    if (proeminencia < minProem) continue;

    // Um bico largo devolve muitos picos empatados; fica o primeiro de cada platô.
    const ultimo = pontas[pontas.length - 1];
    if (ultimo && xs[k].x - ultimo.x <= minProem / 2 && ultimo.y <= xs[k].v) continue;
    pontas.push({ x: xs[k].x, y: xs[k].v, proeminencia });
  }
  return { pontas, topo };
}
