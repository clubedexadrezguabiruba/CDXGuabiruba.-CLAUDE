/**
 * A CURVATURA DA CURVA EMITIDA — `npm run avatar:curvatura`
 *
 * A única régua do projeto que mede o **artefato final** em vez da tabela de
 * entrada, e é por isso que ela vale.
 *
 * Entre a tabela de `geometria.ts` e a curva que o navegador desenha existe a
 * conversão Catmull-Rom → Bézier. Uma tabela de pontos perfeitamente lisa pode
 * emitir uma curva com repuxo, e foi exatamente o que aconteceu duas vezes: o
 * arremate do tronco fechava com **inversão de curvatura de raio 10,7** num canto,
 * e a spline uniforme repuxava no topo esquerdo onde os pontos ficam desiguais.
 * Nenhuma inspeção da tabela mostraria isso — a resposta mora na curva.
 *
 * Promovida de `.scratch/estilo/curvatura.ts` no Bloco 2a.2. O motivo é de uso: era
 * a ferramenta chamada toda vez que uma peça nova perguntava *"minha spline tem
 * quina?"*, e viver em `.scratch` significa ser reescrita a cada vez.
 *
 * ---------------------------------------------------------------------------
 * DUAS DECISÕES DE MEDIÇÃO QUE PARECEM DETALHE E NÃO SÃO
 * ---------------------------------------------------------------------------
 *
 * **1. O espaçamento é em ARCO, não em índice.** A curvatura sai do círculo
 * circunscrito a três pontos, e a distância entre eles define a janela da medida.
 * Espaçando por índice, a janela encolhe onde a amostragem adensa, e a mesma curva
 * reportaria raios diferentes em trechos diferentes. Espaçando por 4 unidades de
 * arco, a janela é física e comparável ao longo de todo o percurso.
 *
 * **2. Inversão é REVERSÃO DE SINAL, não virada grande.** A primeira versão marcava
 * toda virada acima de 18° e gritava no canto do queixo, onde os pontos estão a
 * 26 u e o raio é 48 — 31,7° é exatamente a curva que a forma tem. Num contorno
 * fechado a soma das viradas é ±360°, então o sinal dominante é o sentido do laço;
 * curvatura com o sinal contrário é a curva voltando sobre si, e isso é sempre
 * defeito, em qualquer escala.
 *
 * O limiar `|k| > 0,002` (raio 500 u) corta o ruído de amostragem: um trecho reto
 * oscila em torno de zero e cruzaria o sinal sem significar nada.
 *
 * ---------------------------------------------------------------------------
 * O QUE FAZER COM O RESULTADO
 * ---------------------------------------------------------------------------
 *
 * O raio impresso junto com a inversão **separa dois consertos diferentes**:
 *
 *  - **reversão com raio grande** → degrau de emenda entre duas varreduras. Alisa
 *    (média móvel em comprimento de arco, ANTES de decimar);
 *  - **raio menor que o traço** → ponto no lugar errado, ou pontos demais. Um raio
 *    abaixo de `TRACO` é a definição operacional de bico: o contorno fecha num
 *    canto mais fechado que a própria linha que o desenha.
 *
 * ---------------------------------------------------------------------------
 * ELA MEDE SÓ O TRECHO VISÍVEL, E A PRIMEIRA VERSÃO NÃO MEDIA
 * ---------------------------------------------------------------------------
 *
 * Rodando sobre o path inteiro, ela reprovou **tudo** — e nenhuma das reprovações
 * era defeito:
 *
 *  - os cinco cabelos deram raio mínimo **1,9**, que é o canto do retângulo de
 *    fechamento da touca. Aquele retângulo fica 60 unidades fora da caixa da
 *    cabeça e o `clipPath` o come inteiro; ele é lixo geométrico de propósito;
 *  - o tronco deu **3,6**, que é o ombro: o topo do tronco é uma reta que encontra
 *    o perfil em ângulo, e a cabeça opaca cobre a junção.
 *
 * Uma régua que reprova a base aprovada não é rigor, é o gate que ensina a ignorar
 * o vermelho — e este projeto já pagou o oposto (`verify:avatar-assets` vermelho
 * por meses) e este mesmo (`avatar:garment` verde por vacuidade). Cada alvo declara
 * o que dele aparece, e a estatística sai só dali.
 *
 * ---------------------------------------------------------------------------
 * E ELA REPORTA, NÃO REPROVA
 * ---------------------------------------------------------------------------
 *
 * Sai sempre com código 0, como o `avatar:linha-de-centro`. Quem reprova é o
 * `avatar:pose` (perfil e marcos) e o `avatar:folha-base` (orçamento e distinção).
 * Esta é ferramenta de **investigação**: ela responde *"onde a minha curva repuxa,
 * e qual dos dois consertos serve"*, e a resposta exige leitura — uma franja
 * recortada em festões TEM curvatura invertida, e isso é o desenho, não o defeito.
 */

import { chromium } from "@playwright/test";
import { CAIXA_CABECA, TRACO, pathCabeca, pathTronco } from "../../../src/lib/avatar/estilo/geometria";
import { CABELOS, MODELOS_CABELO, pathCabelo } from "../../../src/lib/avatar/estilo/cabelo";

/** Amostras por curva. 1200 dá passo de ~1 u num contorno de 1200 u. */
const N = 1200;

/** A janela da medida, em unidades de ARCO. Ver a decisão 1 no topo. */
const JANELA_ARCO = 4;

/** Abaixo disto, `k` é ruído de amostragem de um trecho reto (raio 500 u). */
const RUIDO = 0.002;

interface Ponto {
  x: number;
  y: number;
  s: number;
}

interface Achado {
  rotulo: string;
  comprimento: number;
  /** Quantas das `N` amostras caem no trecho que o observador vê. */
  visiveis: number;
  raioMinimo: number;
  raioMediano: number;
  inversoes: { x: number; y: number; raio: number; arco: number }[];
}

async function medirPath(
  pg: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newPage"]>>,
  rotulo: string,
  d: string,
  visivel: (p: Ponto) => boolean,
): Promise<Achado> {
  await pg.setContent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700">` +
      `<path id="alvo" d="${d}" fill="none"/></svg>`,
  );

  const { L, pts } = await pg.evaluate((n) => {
    const p = document.getElementById("alvo") as unknown as SVGPathElement;
    const total = p.getTotalLength();
    const saida: { x: number; y: number; s: number }[] = [];
    for (let i = 0; i < n; i++) {
      const s = (total * i) / n;
      const q = p.getPointAtLength(s);
      saida.push({ x: q.x, y: q.y, s });
    }
    return { L: total, pts: saida };
  }, N);

  const p = pts as Ponto[];
  const salto = Math.max(2, Math.round((JANELA_ARCO / L) * N));

  /** Curvatura COM SINAL, do círculo circunscrito a três pontos. */
  const ks: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = p[(i - salto + N) % N];
    const b = p[i];
    const c = p[(i + salto) % N];
    const ax = b.x - a.x;
    const ay = b.y - a.y;
    const bx = c.x - b.x;
    const by = c.y - b.y;
    const cross = ax * by - ay * bx;
    const la = Math.hypot(ax, ay);
    const lb = Math.hypot(bx, by);
    const lc = Math.hypot(c.x - a.x, c.y - a.y);
    ks.push(la * lb * lc === 0 ? 0 : (2 * cross) / (la * lb * lc));
  }

  // O SINAL sai do path INTEIRO — é o sentido do laço, e um laço fechado tem um
  // sentido só. Calculá-lo sobre o trecho visível o faria depender do recorte.
  const sinal = Math.sign(ks.reduce((s, v) => s + v, 0));
  const cruas: { i: number; k: number }[] = [];
  for (let i = 0; i < N; i++) {
    if (!visivel(p[i])) continue;
    if (Math.sign(ks[i]) === -sinal && Math.abs(ks[i]) > RUIDO) cruas.push({ i, k: ks[i] });
  }

  // Agrupa inversões contíguas: sem isso um repuxo de 30 u de arco vira 30 linhas
  // de relatório, e o relatório deixa de ser lido.
  const grupos: (typeof cruas)[] = [];
  for (const inv of cruas) {
    const ult = grupos[grupos.length - 1];
    if (ult && p[inv.i].s - p[ult[ult.length - 1].i].s < L / 40) ult.push(inv);
    else grupos.push([inv]);
  }

  const abs = ks
    .map((k, i) => ({ k: Math.abs(k), i }))
    .filter((v) => visivel(p[v.i]))
    .map((v) => v.k)
    .sort((a, b) => a - b);
  if (!abs.length) throw new Error(`curvatura: nada visível em "${rotulo}"`);

  return {
    rotulo,
    comprimento: L,
    visiveis: abs.length,
    raioMinimo: 1 / abs[abs.length - 1],
    raioMediano: 1 / abs[Math.floor(abs.length / 2)],
    inversoes: grupos.map((g) => {
      const pior = g.reduce((m, v) => (Math.abs(v.k) > Math.abs(m.k) ? v : m), g[0]);
      return {
        x: p[pior.i].x,
        y: p[pior.i].y,
        raio: 1 / Math.abs(pior.k),
        arco: p[g[g.length - 1].i].s - p[g[0].i].s,
      };
    }),
  };
}

/** Tudo aparece: o contorno da cabeça é a borda externa da figura inteira. */
const TUDO = () => true;

/**
 * Do tronco, o que o observador vê é o que fica ABAIXO da base da cabeça. O topo
 * dele é uma reta que encontra o perfil em ângulo, e a cabeça opaca cobre a junção
 * — é oclusão deliberada (a ordem de camadas do compositor), não descuido.
 */
const ABAIXO_DA_CABECA = (p: Ponto) => p.y > CAIXA_CABECA.y1;

/**
 * De um cabelo, o que aparece é o que cai DENTRO do crânio: o `clipPath` da cabeça
 * come o resto. A margem de um traço para dentro tira a própria borda, onde o
 * contorno da cabeça é desenhado por cima e esconde o corte.
 */
const DENTRO_DO_CRANIO = (p: Ponto) =>
  p.x > CAIXA_CABECA.x0 + TRACO &&
  p.x < CAIXA_CABECA.x1 - TRACO &&
  p.y > CAIXA_CABECA.y0 + TRACO &&
  p.y < CAIXA_CABECA.y1;

async function main() {
  const alvos: [string, string, (p: Ponto) => boolean][] = [
    ["cabeça", pathCabeca(), TUDO],
    ["tronco", pathTronco(), ABAIXO_DA_CABECA],
  ];
  for (const m of MODELOS_CABELO) {
    const d = pathCabelo(m);
    // O moicano não tem touca — ver `cabelo.ts`. Medir string vazia daria uma
    // aprovação por vacuidade, que é o defeito que este projeto já pagou duas vezes.
    if (d) alvos.push([`cabelo · ${CABELOS[m].nome}`, d, DENTRO_DO_CRANIO]);
  }

  const nav = await chromium.launch();
  const achados: Achado[] = [];
  try {
    const pg = await nav.newPage();
    for (const [rotulo, d, visivel] of alvos) {
      achados.push(await medirPath(pg, rotulo, d, visivel));
    }
  } finally {
    await nav.close();
  }

  console.log(
    `curvatura da curva EMITIDA — ${N} amostras, janela de ${JANELA_ARCO} u de arco.\n` +
      `Mede só o TRECHO VISÍVEL de cada peça: o que o clip corta e o que a cabeça cobre\n` +
      `ficam de fora, senão a régua reprova a base aprovada por causa de lixo geométrico.\n\n` +
      `Raio abaixo de TRACO (${TRACO}) é BICO — o contorno fecha mais apertado que a linha\n` +
      `que o desenha. Inversão não é erro por si: uma franja em festões tem, e é o desenho.\n`,
  );

  for (const a of achados) {
    const bico = a.raioMinimo < TRACO;
    console.log(
      `${a.rotulo.padEnd(22)} ${a.comprimento.toFixed(0).padStart(5)} u  ` +
        `(${String(a.visiveis).padStart(4)}/${N} visíveis)   ` +
        `raio mín ${a.raioMinimo.toFixed(1).padStart(7)}${bico ? " ← BICO" : ""}   ` +
        `mediano ${a.raioMediano.toFixed(0).padStart(6)}   ` +
        `${a.inversoes.length} inversão(ões)`,
    );
    for (const i of a.inversoes) {
      console.log(
        `    em (${i.x.toFixed(1)}, ${i.y.toFixed(1)})  raio ${i.raio.toFixed(1)} u  ` +
          `ao longo de ${i.arco.toFixed(1)} u de arco   ` +
          `→ ${i.raio > TRACO * 3 ? "degrau de emenda: alisar ANTES de decimar" : "ponto no lugar errado"}`,
      );
    }
  }

  console.log(
    `\nEsta ferramenta REPORTA e não reprova — quem reprova é o avatar:pose e o\n` +
      `avatar:folha-base. Leia a lista e decida: bico é sempre defeito; inversão\n` +
      `depende de o desenho pedir concavidade ali.`,
  );
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
