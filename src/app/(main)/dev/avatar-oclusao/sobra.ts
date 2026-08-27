/**
 * O QUE SOBRA — o overlay que mostra o que o OLHO vê, não o que a régua escolheu olhar.
 *
 * ---------------------------------------------------------------------------
 * O PEDIDO QUE FEZ ISTO EXISTIR
 * ---------------------------------------------------------------------------
 *
 * O Doug: *"a régua diz que só sobra cabelo do lado esquerdo da boina; eu vejo
 * também no direito"*. Ele estava certo, e o motivo é de construção: a régua contava
 * escape como *"cabelo acima da linha de baixo do chapéu, na mesma coluna"*, e onde
 * o chapéu não tem tinta não existe linha. **Cabelo AO LADO do chapéu caía num balde
 * que ninguém lia** — 644 057 px somados nos 171 pares, contra 4 636 px da zona que
 * a régua media.
 *
 * Este módulo não escolhe zona: ele pinta **todo** o cabelo que sobrevive ao chapéu,
 * e usa a cor só para dizer de que tipo é cada pedaço. O olho decide o resto.
 *
 * ---------------------------------------------------------------------------
 * DE ONDE SAI CADA MÁSCARA — e por que nenhuma vem de "quase igual"
 * ---------------------------------------------------------------------------
 *
 * | máscara | fonte |
 * |---|---|
 * | cabelo | as `formas` do tonal, desenhadas por `Path2D` |
 * | região | o `d` que a rota devolveu — o mesmo que o produto usa |
 * | tinta do chapéu | o `.svg` da peça, que já é 780×930 e já é a `CAIXA_DA_ARTE` |
 *
 * As três caem no MESMO quadro, que é o quadro do raster da arte e o quadro em que a
 * mão pinta a correção: 1 px aqui é 1 px lá, sem conversão no meio.
 *
 * ⚠️ **A tinta do chapéu não é decoração da conta — é ela que separa "ao lado" de
 * "por trás".** Sem ela não há como saber se um pixel de cabelo está fora da peça ou
 * escondido debaixo dela, e foi exatamente essa a falta que cegou a régua.
 */

import { CABELOS, type ModeloCabelo } from "@/lib/avatar/estilo/cabelo";
import { CAIXA_CABECA, CAIXA_DA_ARTE } from "@/lib/avatar/estilo/geometria";

/** O quadro: o raster da arte, 1,2 px por unidade. */
export const RASTER: { w: number; h: number } = { w: 780, h: 930 };

/** Unidade da arte -> px do raster. É a única conversão deste arquivo. */
const K = RASTER.w / CAIXA_DA_ARTE.w;

/** Esquerda é a de quem OLHA: x menor que o eixo da cabeça. */
const CENTRO = (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2;

/**
 * As zonas, e a cor com que cada uma se pinta.
 *
 * ⚠️ **A linha que separa "estourando" de "saindo por baixo" é o PONTO MAIS LARGO
 * da peça, de cada lado — nunca uma constante de cabeça.** A primeira versão usou
 * meia cabeça (y 196) e acusou 4 949 px no `chanel` + `chapeu-de-palha`, onde não
 * sobra nada: a aba da palha é larga e baixa, e o que aparece está EMBAIXO dela, que
 * é o que um chapéu de palha faz. Abaixo do ponto mais largo a aba está abrindo;
 * acima dele o chapéu está sobre a cabeça. É a mesma linha que a esteira usa em
 * `oclusao-do-chapeu.ts`, e ela vale por lado — a `boina` é torta.
 */
export const ZONAS = {
  acima: { cor: [239, 68, 68], nome: "acima da linha", ajuda: "cabelo por cima do chapéu, na coluna dele" },
  aoLado: {
    cor: [217, 70, 239],
    nome: "estourando o chapéu",
    ajuda: "cabelo ao lado da peça, acima do ponto mais largo dela — mais largo que o chapéu",
  },
  abaixo: {
    cor: [56, 189, 248],
    nome: "saindo por baixo",
    ajuda: "franja, costeleta, rabo, e o que sai por baixo da aba — o que um chapéu deixa aparecer",
  },
} as const;

export type Zona = keyof typeof ZONAS;

export interface Sobra {
  /** px por zona, partido em [esquerda, direita]. */
  zonas: Record<Zona, [number, number]>;
  /** massa total da peça, para a conta em porcentagem. */
  massa: number;
  /** o overlay pronto, no quadro do raster. */
  pintura: ImageData;
}

const contexto = (w: number, h: number): CanvasRenderingContext2D => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) throw new Error("sem contexto 2d");
  return g;
};

/**
 * Desenha um punhado de `d` em unidades da arte e devolve o alfa como máscara.
 *
 * `aperto` é a mesma escala em x que o compositor aplica no cabelo quando há chapéu
 * (`apertoDoCabelo`). Ela entra aqui pelo mesmo motivo que a região vem da rota: o
 * overlay tem de medir o que está NA TELA, não uma aproximação dele.
 */
function mascaraDeCaminhos(ds: string[], aperto = 1): Uint8Array {
  const g = contexto(RASTER.w, RASTER.h);
  g.setTransform(K, 0, 0, K, -K * CAIXA_DA_ARTE.x, -K * CAIXA_DA_ARTE.y);
  if (aperto !== 1) {
    g.translate(CENTRO, 0);
    g.scale(aperto, 1);
    g.translate(-CENTRO, 0);
  }
  g.fillStyle = "#000";
  for (const d of ds) g.fill(new Path2D(d), "evenodd");
  const px = g.getImageData(0, 0, RASTER.w, RASTER.h).data;
  const m = new Uint8Array(RASTER.w * RASTER.h);
  for (let i = 0; i < m.length; i++) if (px[i * 4 + 3] >= 8) m[i] = 1;
  return m;
}

/**
 * A tinta do chapéu, do próprio `.svg` da peça.
 *
 * O arquivo já nasce 780×930 com `viewBox="0 0 780 930"` — é o raster da arte com
 * outro nome —, então ele entra sem escala nenhuma. Uma conversão aqui seria a
 * segunda descrição da `CAIXA_DA_ARTE`, que é o defeito nº 1 desta rota.
 */
const cacheTinta = new Map<string, Uint8Array>();

export async function tintaDoChapeu(rota: string): Promise<Uint8Array> {
  const guardada = cacheTinta.get(rota);
  if (guardada) return guardada;
  const img = await new Promise<HTMLImageElement>((ok, erro) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => erro(new Error(`não consegui carregar ${rota}`));
    i.src = rota;
  });
  const g = contexto(RASTER.w, RASTER.h);
  g.drawImage(img, 0, 0, RASTER.w, RASTER.h);
  const px = g.getImageData(0, 0, RASTER.w, RASTER.h).data;
  const m = new Uint8Array(RASTER.w * RASTER.h);
  for (let i = 0; i < m.length; i++) if (px[i * 4 + 3] >= 8) m[i] = 1;
  cacheTinta.set(rota, m);
  return m;
}

const cacheCabelo = new Map<string, Uint8Array>();

function massaDoCabelo(modelo: ModeloCabelo, aperto: number): Uint8Array {
  const chave = `${modelo}@${aperto}`;
  const guardada = cacheCabelo.get(chave);
  if (guardada) return guardada;
  const tonal = (CABELOS as Record<string, { tonal?: { formas: { d: string }[] } }>)[modelo].tonal;
  if (!tonal) throw new Error(`${modelo} não é tonal`);
  // ⚠️ As duas `formas` carregam o MESMO `d` — contorno e tinta. Desenhadas uma a
  // uma elas se somam; concatenadas num `d` só, sob `evenodd`, se CANCELAM e a
  // silhueta sai vazia. Foi assim que a régua do par nasceu verde por vacuidade.
  const m = mascaraDeCaminhos(
    tonal.formas.map((f) => f.d),
    aperto,
  );
  cacheCabelo.set(chave, m);
  return m;
}

/**
 * A conta e a pintura, num só passo.
 *
 * `regiao` é o `d` de `escondeCabelo` **do editor** — o que a rota acabou de traçar,
 * não o do catálogo. É o que faz o overlay responder à pincelada na mesma hora.
 */
export function medirSobra(
  modelo: ModeloCabelo,
  tinta: Uint8Array,
  regiao: string | undefined,
  aperto = 1,
): Sobra {
  const massa = massaDoCabelo(modelo, aperto);
  const oculta = regiao ? mascaraDeCaminhos([regiao]) : new Uint8Array(RASTER.w * RASTER.h);

  // O envelope da peça: o piso por coluna, as bordas por linha, e o ponto mais largo
  // de cada lado. É o que responde "este pixel está acima do chapéu, estourando ele
  // pelo lado, ou saindo por baixo?".
  const limite = new Int32Array(RASTER.w).fill(-1);
  const esq = new Int32Array(RASTER.h).fill(-1);
  const dir = new Int32Array(RASTER.h).fill(-1);
  let bordaEsq = RASTER.w;
  let bordaDir = -1;
  let linhaEsq = -1;
  let linhaDir = -1;
  for (let y = 0; y < RASTER.h; y++) {
    const base = y * RASTER.w;
    for (let x = 0; x < RASTER.w; x++) {
      if (!tinta[base + x]) continue;
      if (esq[y] < 0) esq[y] = x;
      dir[y] = x;
      limite[x] = y;
    }
    if (esq[y] < 0) continue;
    // No empate fica a linha mais BAIXA — é onde a aba termina de abrir.
    if (esq[y] <= bordaEsq) {
      bordaEsq = esq[y];
      linhaEsq = y;
    }
    if (dir[y] >= bordaDir) {
      bordaDir = dir[y];
      linhaDir = y;
    }
  }

  const zonas: Record<Zona, [number, number]> = {
    acima: [0, 0],
    aoLado: [0, 0],
    abaixo: [0, 0],
  };
  const pintura = new ImageData(RASTER.w, RASTER.h);
  const saida = pintura.data;
  let total = 0;

  for (let y = 0; y < RASTER.h; y++) {
    const base = y * RASTER.w;
    for (let x = 0; x < RASTER.w; x++) {
      const i = base + x;
      if (!massa[i]) continue;
      total++;
      if (oculta[i] || tinta[i]) continue; // a região o contém, ou a peça o tapa
      const lado = CAIXA_DA_ARTE.x + ((x + 0.5) / RASTER.w) * CAIXA_DA_ARTE.w < CENTRO ? 0 : 1;
      let zona: Zona;
      if (limite[x] >= 0 && y <= limite[x]) zona = "acima";
      else if (esq[y] >= 0 && ((x < esq[y] && y <= linhaEsq) || (x > dir[y] && y <= linhaDir)))
        zona = "aoLado";
      else zona = "abaixo";
      zonas[zona][lado]++;
      const [r, g, b] = ZONAS[zona].cor;
      saida[i * 4] = r;
      saida[i * 4 + 1] = g;
      saida[i * 4 + 2] = b;
      saida[i * 4 + 3] = zona === "abaixo" ? 90 : 200;
    }
  }
  return { zonas, massa: total, pintura };
}
