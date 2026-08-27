/**
 * P2 — A PEÇA SAI DA ARTE: paleta instrumental ∩ região permitida.
 *
 * ---------------------------------------------------------------------------
 * POR QUE NÃO É DIFERENÇA DE PIXEL, JÁ QUE A BASE É CONHECIDA
 * ---------------------------------------------------------------------------
 *
 * Era a hipótese forte do pedido, e a arte real a derrubou pela metade — de um
 * jeito que só medindo dava para saber.
 *
 * O Gate −1 provou que o gerador preservou a GEOMETRIA: deslocamento (0, 0),
 * escala 100,00%, zero ladrilhos de mudança de forma no rosto. E provou que ele
 * **não** preservou os pixels: repintou as cinco feições do rosto de `#000000`
 * para ~`#464646`, e 23,89% da região do rosto mudou de cor sem mudar de forma.
 * Fora as pontas, o SynthID grava marca em toda imagem gerada.
 *
 * Uma extração por igualdade de RGBA levaria as feições repintadas junto. Uma por
 * "tudo que mudou" levaria o rosto inteiro. A diferença é ótima para PERGUNTAR
 * *"o boneco continua o mesmo?"* — e é isso que o Gate −1 faz com ela — e é ruim
 * para responder *"quais pixels são a peça?"*.
 *
 * Quem responde isso é a cor instrumental: o ciano mora em ~180°, e nada mais na
 * base mora perto (a pele está em 27°, o fundo e o pano têm saturação baixa
 * demais para ter matiz). É a regra 10 da §7b do doc 15 usada como instrumento, e
 * é o que `avatar:gerar` já faz hoje com o teal de 177°.
 *
 * ---------------------------------------------------------------------------
 * O CONTORNO DO CABELO É PRETO, E PRETO NÃO TEM MATIZ
 * ---------------------------------------------------------------------------
 *
 * Aqui a diferença volta, e agora ela é a ferramenta certa: um pixel escuro que
 * **na base não era escuro** só pode ter sido desenhado agora. É lícito usá-la
 * porque o Gate −1 já provou o registro — sem essa prova, a mesma conta em cima
 * de uma arte deslocada devolveria o contorno do boneco inteiro como se fosse
 * peça.
 *
 * ---------------------------------------------------------------------------
 * MAS ELA SOZINHA DESCARTAVA O TRAÇO QUE A PEÇA TEM DIREITO — BLOCO 2a
 * ---------------------------------------------------------------------------
 *
 * A regra "escuro agora **e** não escuro antes" deixa de fora, por construção,
 * todo trecho em que o contorno do cabelo cai EXATAMENTE sobre o contorno do
 * crânio. A justificativa antiga era que "o compositor redesenha ali com
 * `TRACO = 12`, então perder não custa forma".
 *
 * Ela deixou de valer, e o número mostrou: a cobertura de arco cai **71,9% →
 * 50,0% → 35,7%** conforme a peça cola na cabeça. Quanto mais o cabelo abraça o
 * crânio, mais do próprio contorno dele é jogado fora. E sob qualquer das duas
 * arquiteturas do Bloco 3 a peça passa a ser **dona da própria silhueta** — então
 * essa tinta é dela e precisa voltar.
 *
 * O critério de volta **não é afrouxar o limiar**. É conectividade:
 *
 *  - **preto que encosta na peça é da peça.** Busca em largura de 4-vizinhança
 *    semeada nos pixels de ciano, andando por `ciano ∪ preto`;
 *  - **preto solto é do boneco.** Sobrancelha, olho e boca não encostam em
 *    contorno nenhum, e ficam de fora sem ninguém escrever uma exceção.
 *
 * E a propagação tem **âncora de alcance**, porque sem ela o contorno do crânio
 * conduziria a inundação para o queixo, o pescoço e o tronco — o boneco inteiro
 * viraria peça pelo caminho de um único pixel de encosto. O alcance é `TRACO`
 * unidades a partir do ciano, que é a espessura do contorno que a peça pode ter:
 * um traço mora colado na tinta que ele contorna, por definição de contorno.
 *
 * ---------------------------------------------------------------------------
 * O QUE A REGIÃO PERMITIDA FAZ, E O QUE ELA NÃO FAZ
 * ---------------------------------------------------------------------------
 *
 * Ela **não** recorta a peça no crânio. Isso é o defeito que a rodada anterior
 * mediu e não conseguiu consertar mexendo no lugar errado: *"a fonte carrega as
 * pontas; o clip da cabeça é que não as deixa aparecer"*. A permitida é o canvas
 * inteiro **menos o rosto** — o cabelo pode e deve romper a silhueta.
 *
 * O que ela faz é impedir que olho e boca entrem na peça caso o gerador pinte
 * ciano em cima deles.
 *
 * ---------------------------------------------------------------------------
 * O TRONCO SAIU DAQUI NO BLOCO 12 — e é decisão de arte, não conserto de bug
 * ---------------------------------------------------------------------------
 *
 * Até o Bloco 11 esta linha também tirava a região `corpo`, e a dívida estava
 * declarada desde a R0: *"a região do corpo virou silhueta justamente para salvar
 * cabelo que cai AO LADO do tronco, e nada salva cabelo que cai NA FRENTE dele."*
 *
 * O Doug olhou a folha da rodada 2 do `chanel` e decidiu que **a mecha que cai
 * sobre o tronco fica**. O que ela custava, medido: **4 776 px descartados, 7,2%
 * de borda amputada**, e a ponta esquerda do render **42 px mais alta e 35% mais
 * fina** que a da arte. O cabelo não morria no gerador — morria aqui.
 *
 * A bancada (`Bloco 12`) varreu os pontos de `TRONCO.perfil` como pisos possíveis
 * e mostrou que **do piso 411,6 para cima a peça sai idêntica byte a byte**, então
 * o único eixo que restava era manutenção: um piso finito limpa a peça de HOJE e
 * precisa ser re-derivado para uma mais comprida. Tirar o tronco não precisa.
 *
 * **O que se perdeu, dito com todas as letras:** se o gerador pintar a roupa de
 * ciano, a roupa vira cabelo e nada aqui reclama. É risco aceito — o defeito é
 * berrante e a folha o mostra na hora.
 *
 * **O que NÃO se perdeu:** o Gate −1. Ele chama esta função com `limitar = false`
 * (`gate-menos-um.ts:624`), e com isso o `&&` abaixo curto-circuita e `permitida`
 * fica 1 em todo pixel — o gate nunca enxergou esta linha. Quem prova que o
 * gerador não redesenhou o tronco é a NCC sobre `região ∧ ¬peça`, e `corpo`
 * continua inteiro em `REGIOES_QUE_REPROVAM`. Os seis vereditos das fixtures são
 * **estruturalmente** independentes desta mudança, não só empiricamente.
 */

import { mkdirSync, writeFileSync } from "fs";

import sharp from "sharp";

import { TRACO } from "../../../src/lib/avatar/estilo/geometria";
import {
  ESCALA,
  FUNDO,
  LADO,
  PASTA,
  PNG_BASE,
  paraUnidade,
  regiaoDoPixel,
  saidaDaArte,
} from "./base";
import {
  type Componente,
  type Img,
  carregar,
  componentes,
  delta,
  dilatar,
  distanciaMatiz,
  luz,
  matiz,
  salvarMascara,
} from "./pixels";

// ---------------------------------------------------------------------------
// A paleta instrumental
// ---------------------------------------------------------------------------

/** O matiz do ciano pedido ao gerador. Os três tons compartilham este. */
const MATIZ = 180;
/**
 * Tolerância de matiz: **±30°**.
 *
 * Larga de propósito. O gerador não devolve o hexadecimal que se pede — na arte
 * real o tom escuro voltou em `#08666E`, que é 184°, e o claro tende a puxar para
 * o verde. 30° cobre de 150° (verde-água) a 210° (azul-claro) e ainda deixa 100°
 * de distância da pele. Apertar isso recortaria mecha, e mecha recortada é o
 * defeito que este projeto já pagou uma folha para aprender.
 */
const TOL_MATIZ = 30;
/**
 * Saturação mínima para o matiz valer alguma coisa: **0,18**.
 *
 * Abaixo disso o matiz é ruído de arredondamento — o fundo `#FBF8F5` tem
 * saturação 0,27 mas matiz 24°, e o pano `#C9BFA8` tem 0,20 em 40°. Nenhum dos
 * dois chega perto de 180°, então quem separa aqui é o matiz; a saturação existe
 * para o cinza-carvão das feições repintadas não virar candidato por acaso.
 */
const SAT_MIN = 0.18;

/** Abaixo desta luminância o pixel é traço. O contorno do projeto é preto puro. */
const ESCURO = 90;

/**
 * O TESTE QUE DEFINE A PEÇA, como função — e ele é exportado por um motivo.
 *
 * Quem **pinta** um render para ser medido por esta mesma régua (a folha de
 * revisão compõe o boneco em teal instrumental para comparar arte contra render)
 * precisa conferir que a tinta escolhida cai dentro desta janela. Sem isso, a cor
 * do render é uma suposição: com `CABELO[1] = #6E4326` — luminância 76,5 — a massa
 * inteira do cabelo cairia em `escuro` e seria lida como TRAÇO. É literalmente o
 * erro que `coroa.ts` já cometeu, e que esta rota registrou como *"limiar
 * calibrado na arte não vale no render"*.
 *
 * Exportar o teste em vez de exportar os três números é o que impede a quarta
 * cópia da mesma condição.
 */
export function ehTeal(r: number, g: number, b: number): boolean {
  const { h, s } = matiz(r, g, b);
  return s >= SAT_MIN && distanciaMatiz(h, MATIZ) <= TOL_MATIZ;
}

/** O outro lado da mesma classificação: preto de traço. */
export const ehEscuro = (r: number, g: number, b: number) => luz(r, g, b) < ESCURO;

/**
 * Componente solta menor que isto, em fração da maior, é ruído: **5%**.
 *
 * Não é zero porque uma peça pode legitimamente ter parte solta — uma mecha que
 * se destaca, um rabo. E não é livre porque o gerador salpica pontinhos de ciano.
 * 5% da massa é grande demais para ser salpico e pequeno demais para ser mecha.
 * Toda componente descartada aparece no relatório com área e caixa: descarte em
 * silêncio é o modo de falha que a skill `avatar-importar-arte` existe para
 * fechar.
 */
const PISO_SOLTA = 0.05;

export type Papel = "massa" | "sombra" | "luz" | "traco";

export interface Extracao {
  /** A peça: 1 onde há tinta da peça. */
  mascara: Uint8Array;
  /** Papel de cada pixel da peça. 0 = fora da peça. */
  papeis: Uint8Array;
  mantidas: Componente[];
  descartadas: Componente[];
  foraDaPermitida: number;
  porPapel: Record<Papel, { pixels: number; corMedia: [number, number, number]; matiz: number }>;
  naoClassificados: number;
  caixaUnidades: { x0: number; y0: number; x1: number; y1: number };
  arte: Img;
  base: Img;
}

/**
 * A ORDEM É A CODIFICAÇÃO de `Extracao.papeis` — `papeis[i] = índice + 1`, com 0
 * significando "fora da peça". Exportada desde a esteira do traje: quem lê
 * `papeis` precisa desta tabela para saber o que cada número quer dizer, e uma
 * segunda cópia dela em outro arquivo seria o começo de duas que divergem — o
 * mesmo motivo pelo qual `pixels.ts` existe.
 */
export const PAPEIS: Papel[] = ["massa", "sombra", "luz", "traco"];

/**
 * Os três tons de ciano, separados por PARTIÇÃO ÓTIMA de luminância.
 *
 * Não por limiar escolhido: é a mesma decisão que `fonte-svg.ts` já tomou no
 * pipeline vigente (`classificar`, partição ótima em vez de corte arbitrário), e
 * pelo mesmo motivo — um limiar fixo calibrado nesta arte não vale na próxima,
 * porque o gerador nunca devolve o mesmo tom duas vezes.
 *
 * Dois cortes num histograma de 256 níveis, escolhidos por menor soma das
 * variâncias internas das três classes. São 32 mil combinações: exaustivo é
 * barato e não tem mínimo local.
 */
function tresTons(lums: number[]): [number, number] {
  const hist = new Float64Array(256);
  for (const v of lums) hist[Math.max(0, Math.min(255, Math.round(v)))]++;
  const n = new Float64Array(257);
  const s1 = new Float64Array(257);
  const s2 = new Float64Array(257);
  for (let i = 0; i < 256; i++) {
    n[i + 1] = n[i] + hist[i];
    s1[i + 1] = s1[i] + hist[i] * i;
    s2[i + 1] = s2[i] + hist[i] * i * i;
  }
  const custo = (a: number, b: number) => {
    const c = n[b] - n[a];
    if (c <= 0) return 0;
    const m = (s1[b] - s1[a]) / c;
    return s2[b] - s2[a] - m * (s1[b] - s1[a]);
  };
  let melhor = Infinity;
  let corte: [number, number] = [85, 170];
  for (let a = 1; a < 255; a++) {
    for (let b = a + 1; b < 256; b++) {
      const v = custo(0, a) + custo(a, b) + custo(b, 256);
      if (v < melhor) (melhor = v), (corte = [a, b]);
    }
  }
  return corte;
}

export interface MascaraDaPeca {
  /** O ciano instrumental, e só ele. Teste HSL puro — não olha para a base. */
  teal: Uint8Array;
  /** O preto que a conectividade ancorada devolveu à peça. */
  traco: Uint8Array;
  /** `teal ∪ traco`. É o que a peça é. */
  peca: Uint8Array;
  /** Pixels de peça que caíram em rosto/corpo, quando `limitar` está ligado. */
  foraDaPermitida: number;
}

/**
 * O QUE É A PEÇA, numa descrição só — e é por isso que ela mora fora de `extrair`.
 *
 * O Gate −1 precisa da mesma resposta que a extração, e uma segunda implementação
 * dela divergiria da primeira: é a lição de seis medições do pipeline morto, e é
 * a razão de `pixels.ts` existir. A diferença entre os dois usos é UM parâmetro.
 *
 * **`limitar` é o que separa os dois usos**, e a assimetria é de propósito:
 *
 *  - a **extração** limita, porque a peça que vai virar código não pode conter
 *    olho nem roupa caso o gerador pinte ciano em cima deles;
 *  - o **gate** não limita, porque ele precisa saber onde a peça está JUSTAMENTE
 *    dentro das regiões protegidas — é ali que ele deve parar de julgar o boneco.
 *    Limitar ali seria pedir a resposta de que a pergunta depende.
 */
/**
 * SALPICO DE TEAL NÃO É DESENHO — e o piso não foi escolhido, ele mora num abismo.
 *
 * Medido na `entrada.png`: **314 componentes de teal.** A maior tem 94 919 px; a
 * segunda tem **21**. As outras 313 somam 898 px. É ruído de reencode do gerador,
 * e entre ele e o desenho há um fator de **4 500×** — qualquer piso de 50 a 800 px
 * dá exatamente o mesmo resultado. O número abaixo não está calibrado no defeito;
 * ele está no vão.
 *
 * **O que o salpico causava, e por que ninguém via.** `perto` dilata o teal por um
 * traço para decidir que preto ANTIGO volta à peça. Um salpico de 3 px sobre a
 * linha do queixo ancora o contorno do queixo inteiro — e a inundação, uma vez
 * dentro dele, o percorre de ponta a ponta. Na `entrada` isso pôs **5 379 px** de
 * queixo dentro da peça, o laço fechou por baixo do rosto e o preenchimento pintou
 * o queixo: **o Doug viu uma barba.** Nenhuma régua acusou, porque a régua de
 * vazamento media ABAIXO de `Y_QUEIXO`, faixa que `limitar` já zera — ela devolvia
 * 0 px por vacuidade, o mesmo modo de falha do `cobertos = 0` de `silhueta.ts`.
 *
 * O piso é **um quadrado de um traço de lado**: menor que a ponta da caneta que
 * desenhou a arte não pode ser marca deliberada. Deriva de `TRACO` e de `ESCALA`,
 * não de olhar a imagem.
 */
const PISO_TEAL = Math.round((TRACO * ESCALA) ** 2);

/** As componentes de uma máscara que sobrevivem a um piso de área, repintadas. */
function semSalpico(m: Uint8Array, w: number, h: number, piso: number): Uint8Array {
  const limpo = new Uint8Array(m.length);
  const fila = new Int32Array(m.length);
  for (const c of componentes(m, w, h)) {
    if (c.area < piso) continue;
    let a = 0,
      b = 0;
    fila[b++] = c.semente;
    limpo[c.semente] = 1;
    while (a < b) {
      const p = fila[a++];
      const x = p % w;
      const y = (p / w) | 0;
      for (const q of [
        x > 0 ? p - 1 : -1,
        x < w - 1 ? p + 1 : -1,
        y > 0 ? p - w : -1,
        y < h - 1 ? p + w : -1,
      ])
        if (q >= 0 && m[q] && !limpo[q]) (limpo[q] = 1), (fila[b++] = q);
    }
  }
  return limpo;
}

export function mascaraDaPeca(
  arte: Img,
  base: Img,
  limitar: boolean,
  /**
   * Desliga a limpeza do salpico. **Só para a régua conferir o número errado.**
   *
   * O método defeituoso fica preservado no código pelo mesmo motivo que
   * `MetodoDePreto` e `MetodoDePele`: uma régua consertada sem o erro ao lado é
   * uma régua que ninguém consegue conferir que está consertada.
   */
  comSalpico = false,
): MascaraDaPeca {
  const n = arte.w * arte.h;
  const cru = new Uint8Array(n);
  const escuro = new Uint8Array(n);
  const permitida = new Uint8Array(n);
  for (let y = 0; y < arte.h; y++) {
    for (let x = 0; x < arte.w; x++) {
      const i = y * arte.w + x;
      const j = i * 3;
      const [r, g, b] = [arte.data[j], arte.data[j + 1], arte.data[j + 2]];
      const reg = regiaoDoPixel(x, y);
      // SÓ O ROSTO RECORTA A PEÇA — o tronco não, desde o Bloco 12. Ver o bloco
      // de comentário logo acima de `mascaraDaPeca`.
      permitida[i] = limitar && reg === "rosto" ? 0 : 1;
      if (ehTeal(r, g, b)) cru[i] = 1;
      if (ehEscuro(r, g, b)) escuro[i] = 1;
    }
  }

  // O SALPICO SAI AQUI, e sai de UMA vez — ver `PISO_TEAL`.
  //
  // Limpo antes de tudo, e não só antes do `perto`: se o salpico continuasse
  // valendo como semente, ele seguiria plantando peça de 3 px que o `PISO_FORMA`
  // descartaria depois em silêncio. Uma definição só de "o que é teal".
  const teal = comSalpico ? cru : semSalpico(cru, arte.w, arte.h, PISO_TEAL);

  // O alcance da âncora: `TRACO` unidades a partir do ciano, em pixels do canvas.
  // Não é folga escolhida — é a espessura que o contorno da peça pode ter.
  const perto = dilatar(teal, arte.w, arte.h, Math.round(TRACO * ESCALA));
  const eraEscuro = (i: number) => {
    const j = i * 3;
    return ehEscuro(base.data[j], base.data[j + 1], base.data[j + 2]);
  };

  // A busca em largura: semeia no ciano e anda por `ciano ∪ preto ancorado`.
  const peca = new Uint8Array(n);
  {
    const fila = new Int32Array(n);
    let ini = 0,
      fim = 0;
    // O preto que a base NÃO tinha entra sem precisar de âncora: ele é desenho
    // novo, e desenho novo é da peça. A âncora existe só para o preto que a base
    // já tinha, que é o que pode ser contorno do boneco.
    const aceita = (i: number) =>
      !peca[i] && permitida[i] && (teal[i] || (escuro[i] && (!eraEscuro(i) || perto[i])));
    for (let i = 0; i < n; i++) if (teal[i] && permitida[i]) (peca[i] = 1), (fila[fim++] = i);
    while (ini < fim) {
      const p = fila[ini++];
      const x = p % arte.w;
      const y = (p / arte.w) | 0;
      for (const q of [
        x > 0 ? p - 1 : -1,
        x < arte.w - 1 ? p + 1 : -1,
        y > 0 ? p - arte.w : -1,
        y < arte.h - 1 ? p + arte.w : -1,
      ])
        if (q >= 0 && aceita(q)) (peca[q] = 1), (fila[fim++] = q);
    }
  }

  // TODO PRETO DA PEÇA PRECISA CHEGAR AO CIANO, e não há exceção para preto solto.
  //
  // A primeira versão desta função abria uma: preto novo, mesmo sem encostar em
  // ciano nenhum, virava peça — "é uma linha que o Doug desenhou". A fixture F
  // mostrou o preço no mesmo dia: ela é um quadrado PRETO de 14 u colado no
  // tronco, sem um pixel de ciano, e com aquela exceção ela era classificada como
  // peça inteira. Ou seja, a fixture que existe para pegar boneco redesenhado
  // passava a ser lida como cabelo legítimo, e o gate aprovava.
  //
  // A regra fica a do plano, sem cláusula: **preto que encosta na peça é da peça,
  // preto solto é do boneco.** Não se perde desenho legítimo com isso — o contorno
  // de uma peça encosta na tinta que ele contorna, por definição de contorno.
  const traco = new Uint8Array(n);
  let foraDaPermitida = 0;
  for (let i = 0; i < n; i++) {
    const novo = escuro[i] && !eraEscuro(i);
    if ((novo || teal[i]) && !permitida[i]) foraDaPermitida++;
    if (peca[i] && !teal[i]) traco[i] = 1;
  }
  return { teal, traco, peca, foraDaPermitida };
}

// ---------------------------------------------------------------------------
// A ROTA DE CORES FINAIS — toda peça de COR ASSADA, desde 2026-08-13
// ---------------------------------------------------------------------------
//
// (Ela nasceu para o traje e o campo virou parâmetro em 2026-08-17, quando chapéu,
// óculos e pet passaram a usar a mesma rota — ver `extrairPorCampo` abaixo.)
//
// Tudo acima desta linha reconhece a peça pela COR: o ciano instrumental em 180°,
// que nada mais na base tem. Era o que permitia responder "quais pixels são a
// peça?" sem confundir com o que o gerador re-sintetizou.
//
// **A paleta permissiva tirou o instrumento.** Com cor final e livre (doc 21 §0), a
// arte chega na cor que o aluno vai ver, e não há mais matiz reservado. O ciano não
// fica pior — ele fica **ausente**.
//
// O que substitui: **diferença contra a base, restrita ao campo do traje**. A
// diferença sozinha é ruim para esta pergunta, e o docstring do topo deste arquivo
// já dizia por quê — ela levaria as feições repintadas, o ruído de reencode e a
// sombra do chão redesenhada. O campo (`noCampoDoTraje`, base.ts) é o que devolve a
// precisão: fora dele nada é roupa, por teto publicado.
//
// **Três filtros, nesta ordem, e cada um responde a um defeito já medido:**
//
//  1. **diferença > `NIVEL_TRAJE`, dentro do campo** — o que mudou onde roupa pode
//     estar;
//  2. **salpico fora** — o mesmo `PISO_TEAL` do cabelo, pelo mesmo motivo e com a
//     mesma derivação (um quadrado de um traço de lado). O gerador salpica;
//  3. **conectividade** — só componentes com pelo menos `PISO_SOLTA` da maior. Uma
//     roupa é uma coisa só; três manchas soltas são reencode.
//
// **O CONTROLE NEGATIVO é a própria base.** Extrair `base-oficial.png` contra ela
// mesma tem de devolver **0 px** — se devolver mais, a régua está inventando peça
// onde não há nenhuma, e todo número que sair dela é ficção. Ele roda em
// `arte:traje` a cada peça, não uma vez na vida.

/**
 * Quanto um canal precisa mudar para o pixel contar como traje: **24 níveis**.
 *
 * O mesmo `NIVEL` do Gate −1 e o mesmo do gate (a) de distinção a 56 px da
 * `folha-base.ts`, e é o mesmo pela mesma razão: abaixo disso a diferença não se
 * acha olhando. Reusar em vez de escolher um número novo evita a segunda régua que
 * diverge da primeira — que é a doença crônica desta rota.
 */
const NIVEL_TRAJE = 24;

/**
 * O SEGUNDO CORTE, e ele existe porque UM corte não distingue duas coisas fracas.
 *
 * `NIVEL_TRAJE` responde *"este pixel mudou?"*. Ele não responde *"esta mudança é a
 * PEÇA?"* — e há duas mudanças fracas com significados opostos:
 *
 *  - o **anti-aliasing da borda de verdade**: 1 a 3 px em que a tinta da peça se
 *    mistura com o que está atrás. É peça, e cortá-lo come a silhueta;
 *  - o **halo** que o gerador pinta em volta: uma sombra larga e fraca, que não é
 *    peça nenhuma e entra na máscara colada na peça — a conectividade a adota.
 *
 * A diferença entre as duas não é a intensidade; é a DISTÂNCIA até tinta forte. O
 * anti-aliasing está colado nela por construção. O halo se afasta.
 *
 * Então o corte vira histerese, a mesma ideia do Canny: **forte** entra sempre;
 * **fraco** entra só se houver forte a até `ALCANCE_DO_FRACO` px.
 *
 * ⚠️ **Medido em 2026-08-25, no `chapeu-cand-10`** — a arte que o Doug aprovou no
 * render e que a `arte:perimetro` reprovava a 78,8%. Ele pegou de olho o que a régua
 * não sabia dizer: *"onde vc marcou em magenta, nem é parte do chapéu"*. Era o halo:
 *
 * | onde | diferença contra a base, mediana |
 * |---|---|
 * | a massa do chapéu | **223** |
 * | a borda com linha | 66 |
 * | os 632 px que reprovavam | **29** — raspando o corte de 24 |
 *
 * O respingo foi medido ANTES de aceitar, e o controle é o que decide: as **oito**
 * peças de chapéu que já passavam ficam entre −0,1 e 0,0 ponto, e a `toca-curta`
 * **que o Doug reprovou** continua reprovada (50,0% → 53,8%). O conserto não salva
 * arte ruim; ele para de contar sombra como peça.
 */
const NIVEL_FORTE = 100;

/**
 * Quantos pixels o fraco pode estar do forte: **3**.
 *
 * É o anti-aliasing de uma borda, com folga — e o número não é escolhido para caber
 * numa arte: entre `K = 2` e `K = 6` o veredito de **todas** as dez peças medidas é
 * o mesmo. Insensível ao parâmetro é o que separa uma régua de um ajuste.
 */
const ALCANCE_DO_FRACO = 3;

export interface ExtracaoPorCampo {
  /** 1 onde há peça. */
  mascara: Uint8Array;
  mantidas: Componente[];
  descartadas: Componente[];
  /** Candidatos que diferiam da base mas caíram FORA do campo do slot. */
  foraDoCampo: number;
  /** Pixels que o filtro de salpico removeu. */
  salpico: number;
  caixaUnidades: { x0: number; y0: number; x1: number; y1: number };
  /** A cor dominante da peça — o fallback chapado de `tinta.cor`. */
  corDominante: [number, number, number];
  arte: Img;
  base: Img;
}

/**
 * O CAMPO É PARÂMETRO DESDE 2026-08-17, e a função deixou de se chamar `extrairTraje`.
 *
 * Ela nasceu para o traje e o corpo dela nunca soube disso: os três filtros
 * (diferença > `NIVEL_TRAJE`, salpico, conectividade) valem para qualquer peça de
 * cor assada. A única coisa específica era `noCampoDoTraje`, chamado no meio do
 * laço — e um `if` com o nome de um slot dentro de uma função genérica é o começo da
 * segunda cópia que diverge da primeira.
 *
 * Com o campo entrando por parâmetro, chapéu, óculos e pet passam por aqui sem uma
 * linha nova. Quem passa `noCampoDoTraje` é o descritor de slot em `traje.ts`.
 */
export async function extrairPorCampo(
  caminhoArte: string,
  campo: (x: number, y: number) => boolean,
): Promise<ExtracaoPorCampo> {
  const arte = await carregar(caminhoArte, FUNDO);
  const base = await carregar(PNG_BASE, FUNDO);
  if (arte.w !== base.w || arte.h !== base.h) {
    throw new Error(
      `a arte tem ${arte.w}×${arte.h} e a base tem ${base.w}×${base.h} — ` +
        `a diferença precisa de índice comum, e o Gate −1 é quem prova isso antes`,
    );
  }
  const n = arte.w * arte.h;

  // ---------------------------------------------- 1. diferença dentro do campo
  //
  // Com HISTERESE — ver `NIVEL_FORTE`. O laço marca as duas classes; o fraco só
  // sobrevive ao passo seguinte se tiver forte por perto.
  const cru = new Uint8Array(n);
  const forte = new Uint8Array(n);
  let foraDoCampo = 0;
  for (let y = 0; y < arte.h; y++) {
    for (let x = 0; x < arte.w; x++) {
      const d = delta(base, arte, x, y);
      if (d <= NIVEL_TRAJE) continue;
      const u = paraUnidade(x, y);
      if (!campo(u.x, u.y)) {
        foraDoCampo++;
        continue;
      }
      const i = y * arte.w + x;
      cru[i] = 1;
      if (d > NIVEL_FORTE) forte[i] = 1;
    }
  }

  // O ALCANCE do forte: dilatação de `ALCANCE_DO_FRACO` passos por 4-vizinhança.
  // Fraco fora dele é halo, e sai da máscara antes do salpico — se ficasse, a
  // conectividade o adotaria por estar colado na peça, que é exatamente como ele
  // entrava até 2026-08-25.
  {
    let alcance = Uint8Array.from(forte);
    for (let passo = 0; passo < ALCANCE_DO_FRACO; passo++) {
      const nova = Uint8Array.from(alcance);
      for (let y = 1; y < arte.h - 1; y++)
        for (let x = 1; x < arte.w - 1; x++) {
          const i = y * arte.w + x;
          if (alcance[i]) continue;
          if (alcance[i - 1] || alcance[i + 1] || alcance[i - arte.w] || alcance[i + arte.w]) nova[i] = 1;
        }
      alcance = nova;
    }
    for (let i = 0; i < n; i++) if (cru[i] && !alcance[i]) cru[i] = 0;
  }

  // ------------------------------------------------------------ 2. o salpico
  const limpo = semSalpico(cru, arte.w, arte.h, PISO_TEAL);
  let salpico = 0;
  for (let i = 0; i < n; i++) if (cru[i] && !limpo[i]) salpico++;

  // ------------------------------------------------------- 3. conectividade
  const comps = componentes(limpo, arte.w, arte.h);
  const maior = comps.length ? comps[0].area : 0;
  const mantidas: Componente[] = [];
  const descartadas: Componente[] = [];
  for (const c of comps) (c.area >= maior * PISO_SOLTA ? mantidas : descartadas).push(c);

  const mascara = new Uint8Array(n);
  {
    const fila = new Int32Array(n);
    for (const s of mantidas.map((c) => c.semente)) {
      let ini = 0,
        fim = 0;
      fila[fim++] = s;
      mascara[s] = 1;
      while (ini < fim) {
        const p = fila[ini++];
        const x = p % arte.w;
        const y = (p / arte.w) | 0;
        for (const q of [
          x > 0 ? p - 1 : -1,
          x < arte.w - 1 ? p + 1 : -1,
          y > 0 ? p - arte.w : -1,
          y < arte.h - 1 ? p + arte.w : -1,
        ])
          if (q >= 0 && limpo[q] && !mascara[q]) (mascara[q] = 1), (fila[fim++] = q);
      }
    }
  }

  // -------------------------------------- a caixa e a cor dominante da peça
  //
  // A dominante é a MODA em blocos de 8 níveis por canal, não a média: a média de
  // uma peça com pano claro e traço preto devolve um cinza que não existe em lugar
  // nenhum do desenho, e é ela que iria para `tinta.cor` como fallback chapado.
  const balde = new Map<number, number>();
  let x0 = arte.w,
    y0 = arte.h,
    x1 = -1,
    y1 = -1;
  for (let i = 0; i < n; i++) {
    if (!mascara[i]) continue;
    const j = i * 3;
    const k = ((arte.data[j] >> 3) << 10) | ((arte.data[j + 1] >> 3) << 5) | (arte.data[j + 2] >> 3);
    balde.set(k, (balde.get(k) ?? 0) + 1);
    const x = i % arte.w;
    const y = (i / arte.w) | 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  let melhorK = -1,
    melhorN = -1;
  for (const [k, c] of balde) if (c > melhorN) (melhorN = c), (melhorK = k);
  // A média DENTRO do balde vencedor: o balde tem 8 níveis de largura, e devolver o
  // centro dele seria arredondar a cor da peça para múltiplo de 8 sem motivo.
  let sr = 0,
    sg = 0,
    sb = 0,
    sn = 0;
  for (let i = 0; i < n; i++) {
    if (!mascara[i]) continue;
    const j = i * 3;
    const k = ((arte.data[j] >> 3) << 10) | ((arte.data[j + 1] >> 3) << 5) | (arte.data[j + 2] >> 3);
    if (k !== melhorK) continue;
    sr += arte.data[j];
    sg += arte.data[j + 1];
    sb += arte.data[j + 2];
    sn++;
  }
  const corDominante: [number, number, number] = sn
    ? [Math.round(sr / sn), Math.round(sg / sn), Math.round(sb / sn)]
    : [0, 0, 0];

  const a = paraUnidade(x0, y0);
  const b = paraUnidade(x1, y1);
  return {
    mascara,
    mantidas,
    descartadas,
    foraDoCampo,
    salpico,
    caixaUnidades: x1 < 0 ? { x0: 0, y0: 0, x1: 0, y1: 0 } : { x0: a.x, y0: a.y, x1: b.x, y1: b.y },
    corDominante,
    arte,
    base,
  };
}

export async function extrair(caminhoArte: string): Promise<Extracao> {
  const arte = await carregar(caminhoArte, FUNDO);
  const base = await carregar(PNG_BASE, FUNDO);
  const n = arte.w * arte.h;

  // ---------------------------------------------------- candidatos, por cor
  const { teal, traco, peca: juntos, foraDaPermitida } = mascaraDaPeca(arte, base, true);

  // ------------------------------------------- componentes: massa e o resto
  const comps = componentes(juntos, arte.w, arte.h);
  const maior = comps.length ? comps[0].area : 0;
  const mantidas: Componente[] = [];
  const descartadas: Componente[] = [];
  for (const c of comps) {
    (c.area >= maior * PISO_SOLTA ? mantidas : descartadas).push(c);
  }

  const mascara = new Uint8Array(n);
  {
    const guardar = new Set(mantidas.map((c) => c.semente));
    const visto = new Uint8Array(n);
    const fila = new Int32Array(n);
    for (const s of guardar) {
      let ini = 0,
        fim = 0;
      fila[fim++] = s;
      visto[s] = 1;
      while (ini < fim) {
        const p = fila[ini++];
        mascara[p] = 1;
        const x = p % arte.w;
        const y = (p / arte.w) | 0;
        const viz = [
          x > 0 ? p - 1 : -1,
          x < arte.w - 1 ? p + 1 : -1,
          y > 0 ? p - arte.w : -1,
          y < arte.h - 1 ? p + arte.w : -1,
        ];
        for (const q of viz) if (q >= 0 && juntos[q] && !visto[q]) (visto[q] = 1), (fila[fim++] = q);
      }
    }
  }

  // ------------------------------------------------------------- os papéis
  const lums: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!mascara[i] || !teal[i]) continue;
    const j = i * 3;
    lums.push(luz(arte.data[j], arte.data[j + 1], arte.data[j + 2]));
  }
  const [c1, c2] = lums.length ? tresTons(lums) : [85, 170];

  const papeis = new Uint8Array(n);
  const soma: Record<Papel, [number, number, number, number]> = {
    massa: [0, 0, 0, 0],
    sombra: [0, 0, 0, 0],
    luz: [0, 0, 0, 0],
    traco: [0, 0, 0, 0],
  };
  let naoClassificados = 0;
  let x0 = arte.w,
    y0 = arte.h,
    x1 = -1,
    y1 = -1;
  for (let i = 0; i < n; i++) {
    if (!mascara[i]) continue;
    const j = i * 3;
    const [r, g, b] = [arte.data[j], arte.data[j + 1], arte.data[j + 2]];
    let papel: Papel;
    if (traco[i]) papel = "traco";
    else {
      const v = luz(r, g, b);
      papel = v < c1 ? "sombra" : v < c2 ? "massa" : "luz";
    }
    if (!teal[i] && !traco[i]) naoClassificados++;
    papeis[i] = PAPEIS.indexOf(papel) + 1;
    const acc = soma[papel];
    acc[0] += r;
    acc[1] += g;
    acc[2] += b;
    acc[3]++;
    const x = i % arte.w;
    const y = (i / arte.w) | 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  const porPapel = {} as Extracao["porPapel"];
  for (const p of PAPEIS) {
    const [r, g, b, c] = soma[p];
    const cor: [number, number, number] = c
      ? [Math.round(r / c), Math.round(g / c), Math.round(b / c)]
      : [0, 0, 0];
    porPapel[p] = { pixels: c, corMedia: cor, matiz: c ? matiz(...cor).h : 0 };
  }

  const a = paraUnidade(x0, y0);
  const b2 = paraUnidade(x1, y1);
  return {
    mascara,
    papeis,
    mantidas,
    descartadas,
    foraDaPermitida,
    porPapel,
    naoClassificados,
    caixaUnidades: { x0: a.x, y0: a.y, x1: b2.x, y1: b2.y },
    arte,
    base,
  };
}

// ---------------------------------------------------------------------------
// Os artefatos
// ---------------------------------------------------------------------------

/**
 * Cor de cada papel no falso-colorido.
 *
 * FALSO-colorido de verdade, e a primeira versão errava nisso: ela pintava cada
 * papel com o próprio ciano dele, então o painel saía **idêntico à peça isolada**
 * e não mostrava classificação nenhuma — a leitura da folha pegou. Cores de
 * matizes distantes entre si são o ponto do painel.
 */
const COR_PAPEL: Record<Papel, [number, number, number]> = {
  massa: [40, 90, 210],
  sombra: [205, 45, 45],
  luz: [240, 200, 40],
  traco: [120, 120, 120],
};

export async function escreverArtefatos(e: Extracao, pasta: string): Promise<void> {
  mkdirSync(pasta, { recursive: true });
  const n = e.arte.w * e.arte.h;

  await salvarMascara(e.mascara, e.arte.w, e.arte.h, `${pasta}/4-mascara.png`);

  // A peça isolada, com alfa — é o que vai para os vetorizadores.
  const rgba = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const j = i * 3;
    if (e.mascara[i]) {
      rgba[i * 4] = e.arte.data[j];
      rgba[i * 4 + 1] = e.arte.data[j + 1];
      rgba[i * 4 + 2] = e.arte.data[j + 2];
      rgba[i * 4 + 3] = 255;
    }
  }
  await sharp(rgba, { raw: { width: e.arte.w, height: e.arte.h, channels: 4 } })
    .png()
    .toFile(`${pasta}/5-peca.png`);

  for (const [nome, fundo] of [
    ["6-peca-fundo-claro", "#FBF8F5"],
    ["7-peca-fundo-escuro", "#1B1B1F"],
  ] as const) {
    await sharp(rgba, { raw: { width: e.arte.w, height: e.arte.h, channels: 4 } })
      .flatten({ background: fundo })
      .png()
      .toFile(`${pasta}/${nome}.png`);
  }

  // Papéis em falso-colorido: massa, sombra, luz, traço.
  const pap = Buffer.alloc(n * 3, 255);
  for (let i = 0; i < n; i++) {
    if (!e.papeis[i]) continue;
    const c = COR_PAPEL[PAPEIS[e.papeis[i] - 1]];
    pap[i * 3] = c[0];
    pap[i * 3 + 1] = c[1];
    pap[i * 3 + 2] = c[2];
  }
  await sharp(pap, { raw: { width: e.arte.w, height: e.arte.h, channels: 3 } })
    .png()
    .toFile(`${pasta}/8-papeis.png`);

  // Descartados, marcados em magenta sobre a arte esmaecida.
  const desc = Buffer.alloc(n * 3);
  for (let i = 0; i < n; i++) {
    const j = i * 3;
    const claro = (v: number) => Math.round(255 - (255 - v) * 0.25);
    desc[j] = claro(e.arte.data[j]);
    desc[j + 1] = claro(e.arte.data[j + 1]);
    desc[j + 2] = claro(e.arte.data[j + 2]);
  }
  for (const c of e.descartadas) {
    for (let y = c.y0; y <= c.y1; y++) {
      for (let x = c.x0; x <= c.x1; x++) {
        const i = y * e.arte.w + x;
        const j = i * 3;
        desc[j] = 230;
        desc[j + 1] = 20;
        desc[j + 2] = 160;
      }
    }
  }
  await sharp(desc, { raw: { width: e.arte.w, height: e.arte.h, channels: 3 } })
    .png()
    .toFile(`${pasta}/9-descartados.png`);
}

export function imprimirExtracao(e: Extracao, caminho: string): void {
  const total = e.mascara.reduce((a, b) => a + b, 0);
  console.log(`P2 — EXTRAÇÃO — ${caminho}\n`);
  console.log(`  pixels da peça          ${total}`);
  console.log(
    `  fora da região permitida ${e.foraDaPermitida} px  ` +
      `(ciano ou traço novo sobre o ROSTO — descartado; o tronco saiu no Bloco 12)`,
  );
  console.log(
    `  caixa em unidades       x ${e.caixaUnidades.x0.toFixed(1)}→${e.caixaUnidades.x1.toFixed(1)}  ` +
      `y ${e.caixaUnidades.y0.toFixed(1)}→${e.caixaUnidades.y1.toFixed(1)}`,
  );
  console.log(`\n  papel      pixels    cor média        matiz`);
  for (const p of PAPEIS) {
    const d = e.porPapel[p];
    console.log(
      `  ${p.padEnd(9)} ${String(d.pixels).padStart(7)}    ` +
        `rgb(${d.corMedia.join(",")})`.padEnd(18) +
        `${d.matiz.toFixed(0)}°`,
    );
  }
  console.log(`  não classificados  ${e.naoClassificados}`);
  console.log(`\n  componentes mantidas   ${e.mantidas.length}`);
  for (const c of e.mantidas) {
    const a = paraUnidade(c.x0, c.y0);
    const b = paraUnidade(c.x1, c.y1);
    console.log(
      `    ${String(c.area).padStart(7)} px   u x ${a.x.toFixed(0)}→${b.x.toFixed(0)} y ${a.y.toFixed(0)}→${b.y.toFixed(0)}`,
    );
  }
  console.log(`  componentes descartadas ${e.descartadas.length}`);
  for (const c of e.descartadas.slice(0, 8)) {
    const a = paraUnidade(c.x0, c.y0);
    console.log(`    ${String(c.area).padStart(7)} px   u (${a.x.toFixed(0)}, ${a.y.toFixed(0)})`);
  }
  if (e.descartadas.length > 8) console.log(`    … e mais ${e.descartadas.length - 8}`);
}

if (process.argv[1]?.endsWith("extrair.ts")) {
  const caminho = process.argv[2] ?? `${PASTA}/chanel.png`;
  const pasta = process.argv[3] ?? `${saidaDaArte(caminho)}/peca`;
  extrair(caminho)
    .then(async (e) => {
      imprimirExtracao(e, caminho);
      await escreverArtefatos(e, pasta);
      writeFileSync(
        `${pasta}/10-relatorio.json`,
        JSON.stringify(
          {
            arte: caminho,
            pixels: e.mascara.reduce((a, b) => a + b, 0),
            foraDaPermitida: e.foraDaPermitida,
            caixaUnidades: e.caixaUnidades,
            porPapel: e.porPapel,
            mantidas: e.mantidas.map((c) => ({ area: c.area, x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1 })),
            descartadas: e.descartadas.map((c) => ({ area: c.area, x0: c.x0, y0: c.y0 })),
          },
          null,
          2,
        ) + "\n",
        "utf-8",
      );
      console.log(`\n  artefatos em ${pasta}/`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
