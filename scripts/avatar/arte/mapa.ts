/**
 * O MAPA DA ESPESSURA — onde engrossar a arte, em vez de quanto.
 *
 * `npm run arte:mapa -- entrada-2 [--watch]`
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE EXISTE
 * ---------------------------------------------------------------------------
 *
 * A régua da espessura (`npm run arte:espessura`) publica percentis: *"46,2% do
 * perímetro abaixo de 8 u"*. Isso diz **quanto**, e quem vai retocar a arte
 * precisa saber **onde** — sem isso, o único plano possível é engrossar o
 * contorno inteiro, e metade desse trabalho é desperdício.
 *
 * O dado já existia: `espessuraDoTraco` mede ponto a ponto ao longo da borda
 * densa, e os percentis eram o resumo que sobrevivia. `Laco.porPonto` passou a
 * carregar o vetor inteiro; este script só o pinta.
 *
 * É a mesma regra que o `CLAUDE.md` já impõe aos closes: **recorte sai de
 * coordenada medida, nunca escolhido a olho.** Aqui, o retoque também.
 *
 * ---------------------------------------------------------------------------
 * A FAIXA CINZA NÃO É PARA ENGROSSAR, E ESSA É A DISTINÇÃO QUE SALVA O RETOQUE
 * ---------------------------------------------------------------------------
 *
 * `u = 0` é **ausência de banda, não banda fina**. No alto do laço quem desenha o
 * contorno é a cabeça do BONECO — que é descarte e não faz parte da peça. Medido
 * na `curto-espetada`: 876 dos 3 028 pontos. Pintar esses pontos de vermelho
 * mandaria engrossar a coroa, onde não há o que engrossar, e o Gate −1 reprovaria
 * o resultado por mexer no boneco.
 *
 * Por isso são QUATRO faixas e não três, e a cinza é desenhada fina e apagada:
 * ela é contexto, não tarefa.
 */

import { mkdirSync, statSync, writeFileSync } from "fs";

import sharp from "sharp";

import { converter } from "./converter";
import { FUNDO, LADO, PASTA } from "./base";
import { carregar } from "./pixels";

/** O alvo: a mesma espessura do contorno do boneco. `PEDIDO-GEMINI.md` já a exige. */
const ALVO = 12;
/** Abaixo disto a banda some a 56 px — o mesmo corte de `converter.ts`. */
const FINA = 8;
/** Entre `FINA` e este valor a peça está na fronteira: passa, mas sem folga. */
const FRONTEIRA = 11;

const SAIDA = "public/dev";

type Faixa = "sem" | "fina" | "fronteira" | "alvo";

/**
 * As quatro faixas e a cor de cada uma. Diagnóstico, não paleta de produto.
 *
 * O violeta do `sem` não é decoração: a primeira versão usava cinza, e ele caía
 * **em cima do line-art cinza do próprio desenho** — indistinguível. Violeta não
 * existe em lugar nenhum desta arte (ciano, preto, pele), então não colide. E a
 * faixa precisa ser vista: confundir "não há banda aqui" com "a banda está fina"
 * manda engrossar a coroa, onde quem desenha o contorno é o BONECO — e o Gate −1
 * reprova o retoque inteiro por isso.
 *
 * O amarelo substituiu o âmbar pelo mesmo tipo de motivo: contra o vermelho, em
 * trechos curtos alternados, âmbar e vermelho liam como uma cor só.
 */
const CORES: Record<Faixa, [number, number, number]> = {
  sem: [124, 58, 237], // violeta — informação, não tarefa
  fina: [220, 38, 38], // vermelho — some a 56 px
  fronteira: [234, 179, 8], // amarelo — passa sem folga
  alvo: [22, 163, 74], // verde — na espessura do boneco
};

/**
 * RAIO ÚNICO, E O ESPAÇAMENTO É O QUE FAZ O MAPA LER.
 *
 * A primeira versão dava raio por faixa — 4 para o vermelho, 1 para o cinza — e
 * errava duas vezes. O disco de raio 4, encostado no vizinho, virava uma **fita
 * sólida de 9 px**: mais larga que a banda de 11 u que o mapa existe para ajudar
 * a julgar, e cobrindo o contorno que se quer olhar. E o raio maior ganhava a
 * sobreposição, então o verde de raio 2 sumia sob o vermelho ao lado — tamanho
 * decidindo leitura, em vez de cor.
 *
 * Agora todos têm o mesmo raio e são **espaçados por comprimento de arco**: entre
 * um marcador e o seguinte sobra desenho à mostra. O mapa vira linha pontilhada
 * sobre o contorno, em vez de tapa-contorno.
 */
const RAIO = 3;
/** Distância mínima, em pixel, entre dois marcadores ao longo da borda. */
const PASSO_DO_MARCADOR = 9;

function faixaDe(u: number): Faixa {
  if (u <= 0) return "sem";
  if (u < FINA) return "fina";
  if (u < FRONTEIRA) return "fronteira";
  return "alvo";
}

/**
 * Desenha um ANEL no buffer RGB. Sem antialiasing de propósito: é instrumento, e
 * borda macia num marcador de diagnóstico só atrapalha a leitura.
 *
 * **Anel e não disco cheio, e o motivo é o defeito que o disco tinha:** o
 * marcador fica centrado no ponto medido, e um disco de raio 3 tapa 7 px — sobre
 * uma banda que a 8 u mede ~9,6 px no canvas. Ou seja, o instrumento cobria
 * justamente o traço que existe para ajudar a julgar. Com o miolo vazado, a banda
 * aparece por dentro do próprio marcador, e a cor continua legível na coroa.
 */
function anel(
  buf: Buffer,
  w: number,
  h: number,
  cx: number,
  cy: number,
  r: number,
  [R, G, B]: [number, number, number],
) {
  const dentro = (r - 1.5) * (r - 1.5);
  const fora = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d = dx * dx + dy * dy;
      if (d > fora || d < dentro) continue;
      const x = Math.round(cx) + dx;
      const y = Math.round(cy) + dy;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = (y * w + x) * 3;
      buf[i] = R;
      buf[i + 1] = G;
      buf[i + 2] = B;
    }
  }
}

export interface Contagem {
  faixa: Faixa;
  pontos: number;
  fracao: number;
}

/**
 * OS RÓTULOS SAEM DA CALIBRAÇÃO CONTRA A PEÇA APROVADA, e a primeira versão
 * deles estava errada.
 *
 * Ela chamava `≥ 11 u` de "no alvo" e `8–11 u` de "passa sem folga", como se a
 * meta fosse levar o perímetro inteiro aos 12 u do traço do boneco. Medindo a
 * `chanel` — a única peça que entrou pela `fiel` e foi aprovada — o quadro é
 * outro: ela tem **90,7% do perímetro entre 8 e 11 u** e só 7% acima de 11.
 *
 * Ou seja, a faixa do meio **é onde a peça boa vive**, não uma zona de risco. O
 * que separa a `chanel` da `entrada-2` é a ponta fina: **2,3% contra 45,3%**.
 * Perseguir "tudo em 12 u" mandaria refazer o desenho inteiro atrás de um número
 * que a própria referência não alcança.
 */
const ROTULO_CURTO: Record<Faixa, string> = {
  fina: `< ${FINA} u — some a 56 px, É O QUE DECIDE`,
  fronteira: `${FINA}–${FRONTEIRA} u — banda de trabalho, é o normal`,
  alvo: `≥ ${FRONTEIRA} u — folgada`,
  sem: "sem banda — NÃO engrossar (é o boneco)",
};

/**
 * Texto virando texto de XML. O rótulo da faixa fina começa com `<`, e sem isto o
 * `sharp` reprova o SVG inteiro com "invalid element name" — um erro que fala de
 * tag e aponta para o lugar errado.
 */
const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A chave de cor e os números, em SVG, para o `composite` assar no PNG. */
function legenda(arte: string, p50: number, contagens: Contagem[]): string {
  const L = 560;
  const A = 34 + contagens.length * 26 + 48;
  const linhas = contagens
    .map((c, i) => {
      const y = 56 + i * 26;
      const [r, g, b] = CORES[c.faixa];
      return (
        // Anel, e não disco: a legenda tem de falar a mesma língua do mapa.
        `<circle cx="26" cy="${y - 4}" r="${RAIO + 1}" fill="none" ` +
        `stroke="rgb(${r},${g},${b})" stroke-width="2"/>` +
        `<text x="42" y="${y}" font-family="monospace" font-size="14" fill="#1a1a1a">` +
        `${String(Math.round(100 * c.fracao)).padStart(3)}%  ${xml(ROTULO_CURTO[c.faixa])}</text>`
      );
    })
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}">` +
    `<rect width="${L}" height="${A}" rx="8" fill="#ffffff" fill-opacity="0.92" stroke="#d4d4d4"/>` +
    `<text x="16" y="28" font-family="monospace" font-size="15" font-weight="bold" fill="#1a1a1a">` +
    `${xml(arte)} — banda p50 ${p50.toFixed(1)} u (alvo ${ALVO} u)</text>` +
    linhas +
    `<text x="16" y="${A - 30}" font-family="monospace" font-size="12" fill="#1a1a1a">` +
    `% do perímetro · u = unidade do viewBox (${ALVO} u = traço do boneco)</text>` +
    `<text x="16" y="${A - 12}" font-family="monospace" font-size="12" fill="#1a1a1a">` +
    `mede SÓ A PEÇA (borda da massa) — o boneco e o traço interno não entram</text>` +
    `</svg>`
  );
}

export async function gerarMapa(arte: string): Promise<{
  contagens: Contagem[];
  p50: number;
  fracaoFina: number;
  destino: string;
}> {
  const caminho = `${PASTA}/${arte}.png`;
  const c = await converter(caminho);
  const im = await carregar(caminho, FUNDO);

  // A ARTE ENTRA APAGADA. Ela é o mapa-base — o que tem de saltar é o marcador,
  // e sobre a arte em força total o vermelho e o âmbar se perdem no cabelo escuro.
  const buf = Buffer.alloc(im.w * im.h * 3);
  for (let i = 0; i < im.w * im.h; i++) {
    for (let ch = 0; ch < 3; ch++) {
      const v = im.data[i * 3 + ch];
      buf[i * 3 + ch] = Math.round(255 - (255 - v) * 0.22);
    }
  }

  // A CONTAGEM SAI DE TODOS OS PONTOS, O DESENHO SÓ DOS AMOSTRADOS. Contar os
  // desenhados faria a porcentagem descrever a amostragem em vez da arte.
  const contador: Record<Faixa, number> = { sem: 0, fina: 0, fronteira: 0, alvo: 0 };
  for (const p of c.porPonto) contador[faixaDe(p.u)]++;

  // A amostragem anda pela borda acumulando distância, e não a cada N-ésimo
  // índice: a borda densa de Moore tem passo desigual (diagonal vale 1,41), e
  // pular por índice adensaria os marcadores justamente nas curvas.
  const marcadores: { x: number; y: number; f: Faixa }[] = [];
  let acumulado = PASSO_DO_MARCADOR;
  for (let k = 0; k < c.porPonto.length; k++) {
    const p = c.porPonto[k];
    if (k > 0) {
      const a = c.porPonto[k - 1];
      acumulado += Math.hypot(p.x - a.x, p.y - a.y);
    }
    if (acumulado < PASSO_DO_MARCADOR) continue;
    acumulado = 0;
    marcadores.push({ x: p.x, y: p.y, f: faixaDe(p.u) });
  }

  // Os "sem banda" por último: são 2% do perímetro e a única faixa que muda o que
  // NÃO se deve fazer. Perder um deles sob um vizinho custa mais que perder um
  // vermelho, que tem mil irmãos ao lado.
  const ordem: Faixa[] = ["alvo", "fronteira", "fina", "sem"];
  for (const f of ordem) {
    for (const m of marcadores) {
      if (m.f !== f) continue;
      anel(buf, im.w, im.h, m.x, m.y, RAIO, CORES[f]);
    }
  }

  const total = c.porPonto.length || 1;
  const contagens: Contagem[] = (["fina", "fronteira", "alvo", "sem"] as Faixa[]).map((faixa) => ({
    faixa,
    pontos: contador[faixa],
    fracao: contador[faixa] / total,
  }));

  mkdirSync(SAIDA, { recursive: true });
  const destino = `${SAIDA}/arte-mapa.png`;
  // A LEGENDA VAI ASSADA NO PNG, e não só na página. O arquivo circula sozinho —
  // vai para o Gemini ao lado da arte, entra em mensagem, é reaberto uma semana
  // depois. Sem chave de cor e sem os números, ele não se interpreta fora do
  // contexto em que nasceu.
  //
  // E vai numa FAIXA ACRESCENTADA ABAIXO, não sobreposta a um canto. Sobreposta,
  // ela não tapava nada nesta peça por sorte de layout: a silhueta da `entrada-2`
  // passa a ~10 px da caixa. Um cabelo mais alto ou mais largo entraria embaixo
  // dela e sumiria justamente na região que se está tentando decidir.
  const svg = legenda(arte, c.espessura.p50, contagens);
  const altura = Number(/height="(\d+)"/.exec(svg)?.[1] ?? 0);
  await sharp(buf, { raw: { width: im.w, height: im.h, channels: 3 } })
    .extend({ bottom: altura, background: "#ffffff" })
    .composite([{ input: Buffer.from(svg), top: im.h, left: 0 }])
    .png()
    .toFile(destino);

  // O painel que a página lê. Escrito junto com o PNG, no mesmo instante, para
  // não existir um estado em que a imagem é nova e o número é velho.
  writeFileSync(
    `${SAIDA}/arte-mapa.json`,
    JSON.stringify(
      {
        arte,
        alvo: ALVO,
        fina: FINA,
        fronteira: FRONTEIRA,
        p50: c.espessura.p50,
        p05: c.espessura.p05,
        p95: c.espessura.p95,
        fracaoFina: c.espessura.fracaoFina,
        contagens,
        lado: LADO,
      },
      null,
      2,
    ),
  );

  return { contagens, p50: c.espessura.p50, fracaoFina: c.espessura.fracaoFina, destino };
}

async function umaPassada(arte: string) {
  const r = await gerarMapa(arte);
  const vermelho = r.contagens.find((c) => c.faixa === "fina");
  console.log(`\nMAPA DA ESPESSURA — ${arte}\n`);
  console.log(
    `  O NÚMERO QUE DECIDE — perímetro abaixo de ${FINA} u:  ` +
      `${(100 * (vermelho?.fracao ?? 0)).toFixed(1)}%`,
  );
  console.log(`  a chanel aprovada, na mesma régua:              2.3%`);
  console.log(`\n  p50 da banda   ${r.p50.toFixed(1)} u   (a chanel: 9.6 u)\n`);
  for (const c of r.contagens) {
    console.log(
      `  ${c.faixa.padEnd(10)} ${String(c.pontos).padStart(5)} pts  ` +
        `${(100 * c.fracao).toFixed(1).padStart(5)}%   ${ROTULO_CURTO[c.faixa]}`,
    );
  }
  console.log(`\n  ${r.destino}   ·   veja em /dev/arte-mapa\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const arte = args.find((a) => !a.startsWith("--"));
  const observar = args.includes("--watch");

  if (!arte) {
    console.error("uso: npm run arte:mapa -- <arte> [--watch]");
    process.exit(1);
  }

  await umaPassada(arte);
  if (!observar) return;

  // OBSERVAR POR mtime, e não por `fs.watch`. O gerador de imagem escreve o
  // arquivo em mais de um passo, e `fs.watch` dispara no meio da escrita — o
  // `sharp` então lê um PNG truncado e o erro que aparece é sobre o formato, que
  // manda depurar o lugar errado. Comparar mtime e reler é lento e é honesto.
  const alvo = `${PASTA}/${arte}.png`;
  let ultima = statSync(alvo).mtimeMs;
  console.log(`  observando ${alvo} — salve a arte e o mapa se refaz\n`);
  setInterval(async () => {
    let m: number;
    try {
      m = statSync(alvo).mtimeMs;
    } catch {
      return; // o gerador pode ter removido e recriado; a próxima volta pega
    }
    if (m === ultima) return;
    ultima = m;
    try {
      await umaPassada(arte);
    } catch (err) {
      console.error(`  ⚠ a passada falhou — provavelmente o arquivo ainda estava sendo escrito`);
      console.error(`    ${err instanceof Error ? err.message : String(err)}`);
    }
  }, 700);
}

if (process.argv[1]?.includes("mapa.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
