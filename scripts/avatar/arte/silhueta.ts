/**
 * DEFEITO 3 — "dá para notar a silhueta da cabeça de leve, apesar de não ter
 * risco preto". A sonda que separa as duas causas possíveis.
 *
 * ---------------------------------------------------------------------------
 * ESTE É O ÚNICO DOS QUATRO DEFEITOS SEM CAUSA MEDIDA
 * ---------------------------------------------------------------------------
 *
 * Os outros três têm arquivo e linha. Este tinha só hipótese, e hipótese não
 * autoriza conserto. As duas candidatas, as duas falseáveis:
 *
 * **(a) DEGRAU DE TOM na fronteira do crânio.** A massa, DENTRO do crânio, é
 * pintada com `--av-cabelo-s` (`compositor.ts:165`); a extensão, FORA dele, com
 * `--av-cabelo` (`compositor.ts:168`) — a cor base, não a escurecida. E
 * `--av-cabelo-s` é `escurecer(cor)`, fator 0,82 (`compositor.ts:416`). Isso é um
 * degrau de luminância que segue EXATAMENTE o contorno do crânio. Bate com as
 * duas palavras do Doug: "de leve" (não é preto) e "a 56 px nota-se mais" (a
 * 56 px os traços pretos se fundem e o que sobra é o degrau).
 *
 * **(b) FAIXA DE PELE EXPOSTA.** `extrair.ts:188-190` descarta o traço da arte
 * que coincide com o preto da base, e o docstring de lá justifica dizendo que
 * "perder ali não custa forma porque o compositor redesenha com `TRACO = 12`".
 * Se a borda da massa ficar mais de meio traço para dentro da linha de centro do
 * crânio, o contorno da cabeça — 12 u CENTRADAS, `compositor.ts:492` — não
 * alcança, e sobra um crescente de pele entre a massa e o traço.
 *
 * ---------------------------------------------------------------------------
 * COMO A SONDA DECIDE, SEM PRECISAR ADIVINHAR COR NENHUMA
 * ---------------------------------------------------------------------------
 *
 * O truque é o render CARECA. Ele mostra exatamente que cor a pele e as facetas
 * têm em cada pixel daquela cabeça — inclusive dentro dos dois gradientes, que
 * não têm cor única para comparar. Então:
 *
 *  - **pele exposta** é onde o render COM peça é igual ao render CARECA. Não há
 *    tabela de cor envolvida, e o teste vale igual sobre faceta, sobre queixo e
 *    sobre a rampa inteira.
 *  - **degrau de tom** é a diferença de luminância entre a tinta logo DENTRO e
 *    logo FORA da fronteira, ignorando o que for traço preto.
 *
 * A sonda anda pela normal do crânio, ponto a ponto do perímetro, e reporta por
 * deslocamento. Ela não conserta nada e não reprova nada: ela diz qual das duas.
 */

import { mkdirSync } from "fs";

import sharp from "sharp";

import type { Cabelo } from "../../../src/lib/avatar/estilo/cabelo";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CAIXA_CABECA, TRACO, VIEWBOX, pathCabeca } from "../../../src/lib/avatar/estilo/geometria";
import { CABELO, LINHA, PELE, escurecer } from "../../../src/lib/avatar/palette";
import { bordaOrdenada } from "../estilo/tracar-cabelo";
import { abrirNavegador, renderizarSvg } from "../render-svg";
import { FUNDO, PASTA, saidaDaArte } from "./base";
import { converter } from "./converter";
import { luz } from "./pixels";

/** Altura do render da sonda. A 1400 px, 1 unidade do `viewBox` vale 2 px. */
const ALT = 1400;
/** Até onde a sonda anda para cada lado da fronteira, em unidades. */
const ALCANCE = 18;
/** Passo da sonda, em unidades. */
const PASSO = 0.5;
/** Abaixo disto, dois pixels são "a mesma cor" — é o `NIVEL` do Gate −1. */
const IGUAL = 24;

/**
 * A CLASSIFICAÇÃO É POR COR, E ISSO NÃO É PREFERÊNCIA — É CORREÇÃO.
 *
 * A primeira versão separava traço de tinta por luminância, com o limiar de 90
 * que `extrair.ts` usa. Sobre a ARTE aquilo funciona: o ciano instrumental é
 * claro e o traço é preto. Sobre o RENDER não funciona, e o número mostrou:
 * `CABELO[1]` é `#6E4326`, luminância 76,5 — a massa inteira caía abaixo do
 * limiar e era contada como traço, em 100% do perímetro.
 *
 * As referências abaixo são exatamente o que o compositor emite, então a
 * distância em RGB decide sem limiar arbitrário: `--av-linha`, `--av-cabelo` (a
 * clara) e `--av-cabelo-s` (a escura, que a massa usa).
 *
 * ---------------------------------------------------------------------------
 * O FUNDO PRECISOU VIRAR REFERÊNCIA, E A FALTA DELE ERA O QUINTO ERRO
 * ---------------------------------------------------------------------------
 *
 * Havia três referências — traço, cabelo claro, cabelo escuro — e todo pixel era
 * atribuído à mais próxima. O fundo `#FBF8F5` dista **529** do castanho claro
 * `#6E4326`, **568** do escurecido e **744** do preto: ou seja, **fundo era
 * classificado como CABELO CLARO**.
 *
 * O que isso fazia: a régua da barra pergunta "há cabelo dos dois lados deste
 * preto?". No `CABELOS.coque` — clipado, sem um pixel de cabelo fora do crânio —
 * a resposta virava SIM, porque o fundo do lado de fora se dizia cabelo. O
 * controle aprovado acusava **97,6% de barra enterrada**, um número absurdo que só
 * apareceu quando ele foi posto ao lado das outras na folha do Bloco 6.
 *
 * Um classificador por vizinho mais próximo **sem a categoria do que é maioria na
 * imagem** atribui essa maioria a alguém. É o mesmo modo de falha do limiar de
 * luminância, com outra roupa.
 *
 * ---------------------------------------------------------------------------
 * E ACRESCENTAR O FUNDO NÃO BASTOU — A REFERÊNCIA TEM DE SER O RENDER CARECA
 * ---------------------------------------------------------------------------
 *
 * Com o fundo na lista, o `curto` caiu de 97,6% para 52,2% — melhor e ainda
 * absurdo. A causa restante é a **pele sombreada**: `escurecer(PELE[2], 0,88)` é
 * `#CD9C73`, que dista **261** do castanho claro e **268** do fundo. A faceta do
 * rosto também se dizia cabelo.
 *
 * E não adianta listar as cores de pele: as facetas são **gradientes**, com um tom
 * diferente em cada linha, e não existe cor única para comparar.
 *
 * A saída é a que o topo deste arquivo já usava para outra coisa — **o render
 * CARECA**. Ele mostra exatamente que cor o boneco tem em cada pixel, faceta,
 * queixo, rampa e fundo inclusive. Então a quarta referência não é uma constante:
 * é `sem[j]`, a cor do careca **naquele mesmo pixel**. Se o que se vê está mais
 * perto do boneco-sem-cabelo do que das duas cores de cabelo, aquilo não é cabelo.
 *
 * Uma referência por pixel não tem como ficar desatualizada em relação à paleta,
 * ao tom de pele escolhido ou ao gradiente — é o mesmo mecanismo em vez de
 * disciplina que o resto do repositório usa.
 */
type Classe = "traco" | "claro" | "escuro" | "pele" | "fundo";

interface Amostra {
  /** Deslocamento pela normal, em unidades. Negativo = para dentro do crânio. */
  d: number;
  pele: number;
  claro: number;
  escuro: number;
  traco: number;
  fundo: number;
}

export interface Sonda {
  perimetro: number;
  /**
   * Perímetro COBERTO pela peça — e é este o denominador honesto.
   *
   * A sonda anda pelo crânio inteiro, queixo e bochecha inclusive, onde não há
   * cabelo nenhum e pele à mostra é o certo. Medir contra o perímetro total
   * diluiria o defeito num denominador que não tem nada a ver com ele: a
   * primeira rodada acusou "47% de pele exposta" que era, em boa parte, o rosto.
   *
   * ---------------------------------------------------------------------------
   * A JANELA DE ±4 u ERA CEGA JUSTAMENTE ONDE O DEFEITO MORA
   * ---------------------------------------------------------------------------
   *
   * A primeira versão perguntava se, a ±4 u da fronteira, o render com peça
   * diferia do careca. Ali os dois são PRETO nos dois casos — o contorno da
   * cabeça tem 12 u centradas na fronteira e é desenhado por cima de tudo. Então
   * a resposta era "não diferem", e `cobertos` saía **zero**.
   *
   * O controle que pegou foi `CABELOS.coque`, no Bloco 1: uma peça que cobre a
   * coroa inteira devolvia `cobertos = 0`, e com isso `aro = 0/0 = 0`. A régua
   * dizia "não há aro" por VACUIDADE, e teria dito o mesmo sobre qualquer peça.
   *
   * A definição agora é direta e não tem janela escolhida a olho: a peça cobre
   * este ponto do crânio se, **logo por dentro da fronteira** — de meio traço
   * para dentro até o alcance da sonda —, o que se vê não é mais o que a careca
   * mostrava. Meio traço é onde o contorno acaba, não um número de gosto.
   */
  cobertos: number;
  amostras: Amostra[];
  /**
   * Candidata (b): a FRESTA — pele à mostra colada ao traço, logo por dentro dele.
   *
   * ---------------------------------------------------------------------------
   * MEDIR "PELE EM QUALQUER PROFUNDIDADE" ERA MEDIR OUTRA COISA
   * ---------------------------------------------------------------------------
   *
   * A versão anterior devolvia o pico de pele sobre TODOS os deslocamentos, e o
   * Bloco 2 mostrou o que isso vale: a peça da `entrada` acusou **42,7%**. Não
   * havia fresta nenhuma — a 18 u para dentro do crânio simplesmente não há
   * cabelo, porque a franja é fina, e isso é o desenho estar certo.
   *
   * A hipótese (b) é específica: *"se a borda da massa ficar mais de meio traço
   * para dentro da linha de centro, o contorno de 12 u centradas não alcança e
   * sobra um crescente de pele ENTRE a massa e o traço"*. Ou seja, a fresta é
   * **contígua ao traço**, não pele a qualquer distância.
   *
   * Então a régua olha a **primeira amostra estritamente fora do traço**
   * (`−TRACO/2 − PASSO`): se ali já é pele, o contorno não alcançou a massa. É a
   * mesma fronteira que o `aro` usa, pelo mesmo motivo, e não é janela escolhida —
   * é onde o traço acaba.
   */
  pele: { fracao: number; em: number };
  /** Diagnóstico: pele em QUALQUER deslocamento. Não é a fresta, e não decide nada. */
  peleBruta: number;
  /** Candidata (a): quem domina logo dentro e logo fora da fronteira. */
  degrau: { dentroEscuro: number; foraClaro: number; delta: number };
  /**
   * O ARO — a causa que a leitura da folha encontrou, e que nenhuma das duas
   * candidatas previa.
   *
   * Preto que corre ENTRE 6 e 16 unidades para DENTRO da fronteira do crânio.
   * Ali não há borda externa de coisa nenhuma: é a emenda da sangria da extensão
   * levando contorno de 12 u por decisão de `compositor.ts:168`. O número é a
   * maior fração do trecho coberto que aparece preta nessa faixa, e ele é o
   * antes/depois do defeito 3.
   */
  aro: { fracao: number; em: number };
  /**
   * A BARRA — o traço do crânio aparecendo POR DENTRO do cabelo, em deslocamento 0.
   *
   * ---------------------------------------------------------------------------
   * ELA EXISTE PORQUE A JANELA DO `aro` FOI CALIBRADA NO DEFEITO
   * ---------------------------------------------------------------------------
   *
   * O `aro` olha de −6 a −16 u, e essa janela foi escolhida **depois** de eu já
   * saber onde estava o problema daquela rodada. Ela exclui justamente o
   * deslocamento 0, que é onde mora o defeito que sobrou: o contorno da cabeça
   * tem 12 u CENTRADAS na linha de centro do crânio (`geometria.ts:851`), a massa
   * é clipada nessa mesma linha, e por isso a massa só pode cobrir os 6 u de
   * dentro. Os 6 u de fora ficam.
   *
   * A régua tem de enxergar isso, e ela nasce VERMELHA: rodada na build de hoje,
   * com `massaPorCima` ligado, ela acusa a barra que sobrou. Régua que nasce
   * junto com o conserto nasce verde e não prova nada (doc 16 §11).
   *
   * ---------------------------------------------------------------------------
   * "PRETO PERTO DA FRONTEIRA" ERA A PERGUNTA ERRADA — BLOCO 3
   * ---------------------------------------------------------------------------
   *
   * A primeira versão media a largura a meia altura do perfil de preto agregado ao
   * longo do perímetro. Funciona quando o preto é **concêntrico** com o crânio, que
   * é o caso do defeito de hoje. E mente quando ele não é: na arquitetura A a peça
   * é dona da própria silhueta, o traço dela corre pela borda da PEÇA e não pela do
   * crânio, e a agregação borra um perfil estreito em cada ponto num perfil largo
   * no conjunto. A bancada mediu **24,5 u para A contra 6,0 u para hoje** — e a
   * leitura do close disse o contrário: em A a coroa está limpa e é *hoje* que tem
   * um arco preto atravessando o cabelo de ponta a ponta.
   *
   * A definição certa é a que o olho usa: **traço com CABELO DOS DOIS LADOS**. Um
   * contorno externo tem fundo ou pele de um lado — é a borda da peça e é o certo.
   * Um traço enterrado tem massa antes e massa depois, e é o defeito.
   *
   * Então a régua deixa de agregar por deslocamento e passa a andar ponto a ponto:
   * em cada normal, acha as corridas de preto e pergunta o que há imediatamente
   * antes e imediatamente depois de cada uma. Nenhum limiar, nenhuma janela.
   */
  barra: {
    /** Fração dos pontos cobertos com traço enterrado — cabelo dos dois lados. */
    fracao: number;
    /** A maior espessura enterrada encontrada, em u. */
    espessuraU: number;
    /** Deslocamento do centro da corrida enterrada mais grossa. */
    em: number;
    de: number;
    ate: number;
  };
}

const cru = async (p: string) =>
  (await sharp(p).greyscale().raw().toBuffer({ resolveWithObject: true })).data;
const rgbCru = async (p: string) =>
  (await sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true })).data;

/**
 * O modo `igualdade` reproduz o erro consertado: "igual à careca" bastava para
 * dizer pele, e dos 5 080 px marcados 5 066 estavam sobre PRETO. Fica aqui
 * preservado para `reguas-conferidas.ts` poder mostrar o número errado ao lado do
 * certo — um conserto que ninguém consegue conferir não é um conserto conferido.
 */
export type MetodoDePele = "superficie" | "igualdade";

export async function sondar(
  peca: Cabelo | undefined,
  rotulo: string,
  destino: string,
  opc: { metodoPele?: MetodoDePele } = {},
): Promise<Sonda> {
  const { metodoPele = "superficie", ...doCompositor } = opc;
  const larg = Math.round((ALT * VIEWBOX.w) / VIEWBOX.h);
  const porU = ALT / VIEWBOX.h;
  const nav = await abrirNavegador();
  const est = { pele: PELE[2], cabelo: CABELO[1] };

  const comArq = `${destino}/s-com-${rotulo}.png`;
  const semArq = `${destino}/s-careca.png`;
  const mskArq = `${destino}/s-cranio.png`;
  // `escala: 1` NAS DUAS, e não é detalhe: a sonda anda pela fronteira do crânio,
  // que ela desenha a partir de `pathCabeca()` em coordenadas do `viewBox`. Se o
  // render encolhesse e a máscara não, a normal seria calculada num lugar e
  // amostrada em outro — a régua mediria o próprio desalinhamento. A escala é
  // transformação EXTERNA; esta régua mede o sistema interno.
  await renderizarSvg(
    nav,
    compor({
      ...est,
      ...(peca ? { modeloCabelo: peca } : {}),
      ns: "sd",
      escala: 1,
      ...doCompositor,
    }),
    larg,
    ALT,
    comArq,
    FUNDO,
  );
  await renderizarSvg(nav, compor({ ...est, ns: "sc", escala: 1 }), larg, ALT, semArq, FUNDO);
  await renderizarSvg(
    nav,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}">` +
      `<rect width="${VIEWBOX.w}" height="${VIEWBOX.h}" fill="#fff"/>` +
      `<path d="${pathCabeca()}" fill="#000"/></svg>`,
    larg,
    ALT,
    mskArq,
    "#FFFFFF",
  );
  await nav.close();

  const [com, sem, mskG] = await Promise.all([rgbCru(comArq), rgbCru(semArq), cru(mskArq)]);
  const cranio = new Uint8Array(larg * ALT);
  for (let i = 0; i < cranio.length; i++) cranio[i] = mskG[i] < 128 ? 1 : 0;

  // A fronteira do crânio, ordenada — a MESMA spline que o `clipPath` usa.
  const borda = bordaOrdenada(cranio, larg, ALT);
  const N = borda.length;
  const R = 6;

  const nPassos = Math.round((2 * ALCANCE) / PASSO) + 1;
  const amostras: Amostra[] = [];
  for (let k = 0; k < nPassos; k++)
    amostras.push({ d: -ALCANCE + k * PASSO, pele: 0, claro: 0, escuro: 0, traco: 0, fundo: 0 });

  const hex = (h: string): [number, number, number] => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const REF: [Classe, [number, number, number]][] = [
    ["traco", hex(LINHA)],
    ["claro", hex(est.cabelo)],
    ["escuro", hex(escurecer(est.cabelo))],
  ];

  // Painel: o perímetro pintado por veredito, para o close da folha.
  const painel = Buffer.from(com);
  const dist = (j: number, c: [number, number, number]) =>
    Math.abs(com[j] - c[0]) + Math.abs(com[j + 1] - c[1]) + Math.abs(com[j + 2] - c[2]);

  // Primeira passada: as normais e a máscara de "este ponto é coberto pela peça".
  const normal: { nx: number; ny: number }[] = [];
  const coberto = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const a = borda[(i - R + N) % N];
    const b = borda[(i + R) % N];
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    // Normal apontando para FORA: a que se afasta do interior da máscara.
    let nx = -ty / len;
    let ny = tx / len;
    if (cranio[Math.round(borda[i].y + ny * 3) * larg + Math.round(borda[i].x + nx * 3)])
      (nx = -nx), (ny = -ny);
    normal.push({ nx, ny });

    for (let d = -ALCANCE; d <= -TRACO / 2 && !coberto[i]; d += PASSO) {
      const x = Math.round(borda[i].x + nx * d * porU);
      const y = Math.round(borda[i].y + ny * d * porU);
      if (x < 0 || y < 0 || x >= larg || y >= ALT) continue;
      const j = (y * larg + x) * 3;
      const dif =
        Math.abs(com[j] - sem[j]) + Math.abs(com[j + 1] - sem[j + 1]) + Math.abs(com[j + 2] - sem[j + 2]);
      if (dif / 3 > IGUAL) coberto[i] = 1;
    }
  }
  let cobertos = 0;
  for (let i = 0; i < N; i++) cobertos += coberto[i];

  /** A primeira amostra estritamente fora do traço — onde a fresta começaria. */
  const D_FRESTA = -TRACO / 2 - PASSO;
  let colados = 0;

  // A classe de cada (ponto do perímetro, passo da normal). 0 = não amostrado.
  // Guardar ponto a ponto é o que permite perguntar "o que há dos DOIS lados deste
  // preto?" — a pergunta que a agregação por deslocamento não consegue fazer.
  const CLASSES: Classe[] = ["traco", "claro", "escuro", "pele", "fundo"];
  const classeEm = new Uint8Array(N * nPassos);

  for (let i = 0; i < N; i++) {
    if (!coberto[i]) continue;
    const { nx, ny } = normal[i];
    for (let k = 0; k < nPassos; k++) {
      const d = amostras[k].d;
      const x = Math.round(borda[i].x + nx * d * porU);
      const y = Math.round(borda[i].y + ny * d * porU);
      if (x < 0 || y < 0 || x >= larg || y >= ALT) continue;
      const j = (y * larg + x) * 3;
      const dif =
        Math.abs(com[j] - sem[j]) + Math.abs(com[j + 1] - sem[j + 1]) + Math.abs(com[j + 2] - sem[j + 2]);

      let classe: Classe;
      // "Igual à careca" NÃO basta para dizer pele, e a leitura da folha pegou:
      // dos 5 080 px que a primeira versão marcou, 5 066 estavam sobre PRETO —
      // era o traço da cabeça coincidindo com o traço da peça, não fresta
      // nenhuma. A segunda condição é o conserto: só é pele se o que a careca
      // tem ali for de fato superfície, e não a linha.
      // PELE SÓ EXISTE DENTRO DO CRÂNIO, e a régua não sabia disso.
      //
      // Terceiro erro que o controle `CABELOS.coque` pegou no Bloco 1: fora do
      // crânio, onde a peça não chega, o render com peça é idêntico ao careca
      // porque os dois mostram FUNDO. A régua lia isso como "pele exposta" e
      // devolvia **100% do trecho coberto** para uma touca que não deixa um
      // milímetro de testa à mostra. Enquanto `cobertos` era zero por vacuidade,
      // ninguém via.
      //
      // O conserto não é outra janela de deslocamento: é a máscara do crânio, que
      // a sonda já carrega. "Pele exposta" quer dizer pele do crânio à mostra, e
      // essa é a definição literal, não uma aproximação por distância.
      const carecaTemSuperficie =
        metodoPele === "igualdade" || luz(sem[j], sem[j + 1], sem[j + 2]) >= 90;
      if (dif / 3 <= IGUAL && carecaTemSuperficie && cranio[y * larg + x]) {
        classe = "pele";
      } else {
        // A QUARTA REFERÊNCIA É DINÂMICA: a cor que o boneco CARECA tem neste
        // mesmo pixel. Ela cobre fundo, pele, faceta, queixo e a rampa inteira de
        // uma vez, sem lista de cores para envelhecer. Ver o docstring de `Classe`.
        const candidatas: [Classe, [number, number, number]][] = [
          ...REF,
          ["fundo", [sem[j], sem[j + 1], sem[j + 2]]],
        ];
        classe = candidatas.reduce(
          (m, r) => (dist(j, r[1]) < dist(j, candidatas.find((q) => q[0] === m)![1]) ? r[0] : m),
          candidatas[0][0],
        );
      }
      amostras[k][classe]++;
      classeEm[i * nPassos + k] = CLASSES.indexOf(classe) + 1;
      if (classe === "pele" && d === D_FRESTA) colados++;
      if (classe === "pele" && d >= -10 && d <= 10) {
        painel[j] = 240;
        painel[j + 1] = 60;
        painel[j + 2] = 30;
      }
    }
  }

  const pele = { fracao: cobertos ? colados / cobertos : 0, em: D_FRESTA };

  // A PELE BRUTA — todas as amostras classificadas como pele, em qualquer
  // deslocamento. Ela NÃO é a fresta e não decide nada: existe para
  // `reguas-conferidas.ts` poder mostrar o método antigo errando. Foi aqui que os
  // 5 066 de 5 080 px "iguais à careca sobre PRETO" apareciam, e sem este número
  // o erro consertado deixaria de ser reproduzível.
  const totalAmostras = amostras.reduce((s, a) => s + a.pele + a.claro + a.escuro + a.traco + a.fundo, 0);
  const peleBruta = totalAmostras
    ? amostras.reduce((s, a) => s + a.pele, 0) / totalAmostras
    : 0;

  // Candidata (a): quem domina logo dentro contra quem domina logo fora. A janela
  // pula os 6 u colados na fronteira, que é onde o contorno de 12 u centradas mora.
  const fracao = (de: number, ate: number, c: Classe) => {
    const f = amostras.filter((a) => a.d >= de && a.d <= ate);
    const tot = f.reduce((s, a) => s + a.pele + a.claro + a.escuro + a.traco + a.fundo, 0);
    return tot ? f.reduce((s, a) => s + a[c], 0) / tot : 0;
  };
  const dentroEscuro = fracao(-16, -7, "escuro");
  const foraClaro = fracao(7, 16, "claro");

  await sharp(painel, { raw: { width: larg, height: ALT, channels: 3 } })
    .png()
    .toFile(`${destino}/s-veredito-${rotulo}.png`);

  /**
   * O CLOSE, de coordenada medida — a coroa, que é onde o Doug aponta.
   *
   * O recorte sai de `CAIXA_CABECA` convertida para pixel do render, nunca
   * escolhido a olho.
   *
   * **São DOIS painéis e não três, e isso é conserto.** A primeira versão punha
   * um terceiro painel de "veredito", com a pele exposta em vermelho. Depois que
   * o classificador foi corrigido — pele só é pele se a careca tiver superfície
   * ali, e não a linha —, a pele exposta caiu a zero, que é a resposta CERTA:
   * não há fresta nenhuma. Só que aí o terceiro painel virava cópia pixel a
   * pixel do segundo, com uma legenda prometendo um vermelho que não existe. Um
   * painel que não pode mais diferir de outro não é evidência, é ruído.
   */
  const cx = Math.round((CAIXA_CABECA.x0 - 20) * (larg / VIEWBOX.w));
  const cy = Math.round((CAIXA_CABECA.y0 - 30) * porU);
  const cw = Math.min(larg - cx, Math.round((CAIXA_CABECA.larg + 40) * (larg / VIEWBOX.w)));
  const ch = Math.min(ALT - cy, Math.round(150 * porU));
  const recorte = { left: cx, top: cy, width: cw, height: ch };
  const corta = (buf: Buffer) =>
    sharp(buf, { raw: { width: larg, height: ALT, channels: 3 } }).extract(recorte).png().toBuffer();
  const [pSem, pCom] = await Promise.all([corta(sem), corta(com)]);
  await sharp({
    create: { width: cw * 2 + 20, height: ch, channels: 3, background: "#FFFFFF" },
  })
    .composite([
      { input: pSem, left: 0, top: 0 },
      { input: pCom, left: cw + 20, top: 0 },
    ])
    .png()
    .toFile(`${destino}/s-close-${rotulo}.png`);

  // A JANELA DO ARO COMEÇA DEPOIS DO TRAÇO, não em cima da borda dele.
  //
  // Quarto erro que o Bloco 1 pegou: ela ia até −6, e −6 é EXATAMENTE a borda
  // interna do contorno da cabeça (12 u centradas na fronteira). Com o
  // denominador consertado, `CABELOS.coque` — que não tem extensão nenhuma, logo
  // não pode ter emenda de sangria — acusava 9,3% de aro em −6 u. Era o contorno
  // legítimo, medido no seu último pixel.
  //
  // `-TRACO/2 - PASSO` é o primeiro deslocamento estritamente fora do traço. Não
  // é escolha de janela: é onde o traço acaba.
  const aro = amostras
    .filter((a) => a.d >= -16 && a.d <= -TRACO / 2 - PASSO)
    .reduce(
      (m, a) => (a.traco / cobertos > m.fracao ? { fracao: a.traco / cobertos, em: a.d } : m),
      { fracao: 0, em: 0 },
    );

  // ------------------------------------------------------------------- a barra
  //
  // TRAÇO COM CABELO DOS DOIS LADOS. Ponto a ponto, sem agregar e sem limiar.
  //
  // Em cada normal: acha as corridas contíguas de `traco`, e pergunta o que há
  // imediatamente antes e imediatamente depois. Se os dois vizinhos são massa de
  // cabelo (`claro` ou `escuro`), aquele preto está ENTERRADO — ninguém desenhou
  // uma barra atravessando o cabelo, ela é o contorno do crânio aparecendo por
  // baixo. Se um dos lados é pele, fundo ou a borda da amostragem, é a borda
  // externa da peça e é o certo.
  const iTraco = CLASSES.indexOf("traco") + 1;
  const iClaro = CLASSES.indexOf("claro") + 1;
  const iEscuro = CLASSES.indexOf("escuro") + 1;
  const eCabelo = (v: number) => v === iClaro || v === iEscuro;
  let comEnterrado = 0;
  let piorU = 0;
  let piorDe = 0;
  let piorAte = 0;
  for (let i = 0; i < N; i++) {
    if (!coberto[i]) continue;
    let achou = false;
    let k = 0;
    while (k < nPassos) {
      if (classeEm[i * nPassos + k] !== iTraco) {
        k++;
        continue;
      }
      let k1 = k;
      while (k1 + 1 < nPassos && classeEm[i * nPassos + k1 + 1] === iTraco) k1++;
      const antes = k > 0 ? classeEm[i * nPassos + k - 1] : 0;
      const depois = k1 + 1 < nPassos ? classeEm[i * nPassos + k1 + 1] : 0;
      // E A CORRIDA TEM DE CRUZAR d = 0, que é onde o contorno do CRÂNIO mora.
      //
      // Sem isso a régua contava também o contorno legítimo de uma mecha desenhada
      // sobre a massa — que tem cabelo dos dois lados e é desenho, não defeito. Na
      // arquitetura A isso dava 33,9% num render que a leitura do close descreveu
      // como coroa limpa. O contorno do crânio é 12 u CENTRADAS na fronteira, por
      // construção de `geometria.ts:851`: se a corrida não contém a fronteira, ela
      // não é ele.
      const cruzaAFronteira = amostras[k].d <= 0 && amostras[k1].d >= 0;
      if (cruzaAFronteira && eCabelo(antes) && eCabelo(depois)) {
        achou = true;
        const esp = (k1 - k + 1) * PASSO;
        if (esp > piorU) {
          piorU = esp;
          piorDe = amostras[k].d;
          piorAte = amostras[k1].d;
        }
      }
      k = k1 + 1;
    }
    if (achou) comEnterrado++;
  }
  const barra = {
    fracao: cobertos ? comEnterrado / cobertos : 0,
    espessuraU: piorU,
    em: (piorDe + piorAte) / 2,
    de: piorDe,
    ate: piorAte,
  };

  return {
    perimetro: N,
    cobertos,
    amostras,
    pele,
    degrau: {
      dentroEscuro,
      foraClaro,
      delta: luz(...hex(est.cabelo)) - luz(...hex(escurecer(est.cabelo))),
    },
    aro,
    barra,
    peleBruta,
  };
}

export function imprimirSonda(s: Sonda, rotulo: string): void {
  console.log(`\nDEFEITO 3 — SONDA DA SILHUETA — ${rotulo}`);
  console.log(
    `  perímetro do crânio ${s.perimetro} pontos, dos quais ${s.cobertos} cobertos pela peça` +
      ` (${((100 * s.cobertos) / s.perimetro).toFixed(0)}%) — o denominador é este\n`,
  );
  console.log(`   desloc.     pele    claro   escuro    traço      (% do trecho coberto)`);
  for (const a of s.amostras) {
    if (a.d % 2 !== 0) continue;
    const pc = (v: number) => `${((100 * v) / s.cobertos).toFixed(1).padStart(6)}%`;
    console.log(
      `   ${a.d.toFixed(0).padStart(4)} u  ${pc(a.pele)} ${pc(a.claro)} ${pc(a.escuro)} ${pc(a.traco)}`,
    );
  }
  console.log(
    `\n  (b) FRESTA DE PELE  ${(100 * s.pele.fracao).toFixed(1)}% do trecho coberto tem pele colada ao traço,` +
      ` em ${s.pele.em.toFixed(1)} u`,
  );
  console.log(
    `  (a) DEGRAU DE TOM  logo DENTRO ${(100 * s.degrau.dentroEscuro).toFixed(1)}% é a cor escura;` +
      ` logo FORA ${(100 * s.degrau.foraClaro).toFixed(1)}% é a clara.` +
      `  As duas cores distam ${s.degrau.delta.toFixed(1)} de luminância`,
  );
  console.log(
    `  (c) ARO DA SANGRIA  ${(100 * s.aro.fracao).toFixed(1)}% do trecho coberto é PRETO a ${s.aro.em.toFixed(0)} u` +
      ` para dentro   ← a causa medida do defeito 3`,
  );
  console.log(
    `  (d) BARRA ENTERRADA ${(100 * s.barra.fracao).toFixed(1)}% do trecho coberto tem preto com CABELO` +
      ` DOS DOIS LADOS; a pior mede ${s.barra.espessuraU.toFixed(1)} u` +
      ` (de ${s.barra.de.toFixed(1)} a ${s.barra.ate.toFixed(1)})   ← o contorno da cabeça por dentro do cabelo`,
  );
}

if (process.argv[1]?.endsWith("silhueta.ts")) {
  const arte = process.argv[2] ?? `${PASTA}/entrada.png`;
  const destino = saidaDaArte(arte);
  mkdirSync(destino, { recursive: true });
  converter(arte)
    .then(async (c) => {
      const casos: [string, Cabelo | undefined][] = [
        ["careca", undefined],
        ["sobreposta", c.peca],
      ];
      const saidas: [string, Sonda][] = [];
      for (const [nome, peca] of casos) {
        const s = await sondar(peca, nome, destino);
        imprimirSonda(s, `${arte} — ${nome}`);
        saidas.push([nome, s]);
      }
      console.log(`\n\n  O QUE SOBROU, nas três réguas de defeito`);
      for (const [nome, s] of saidas)
        console.log(
          `    ${nome.padEnd(14)} aro ${(100 * s.aro.fracao).toFixed(1).padStart(5)}%   ` +
            `fresta ${(100 * s.pele.fracao).toFixed(1).padStart(5)}%   ` +
            `barra enterrada ${(100 * s.barra.fracao).toFixed(1).padStart(5)}%`,
        );
      console.log(`\n  painéis em ${destino}/s-close-*.png`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

