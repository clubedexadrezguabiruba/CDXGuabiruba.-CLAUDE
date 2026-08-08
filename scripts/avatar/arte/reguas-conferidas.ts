/**
 * BLOCO 1 — AS RÉGUAS GANHAM CONTROLES, antes de qualquer outra coisa.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------------------------------------------------------
 *
 * Escrevi quatro medidores nesta rota e **três erraram na primeira rodada**, todos
 * pelo mesmo motivo: limiar de luminância calibrado na ARTE aplicado ao RENDER. E
 * uma quarta falha foi pior — a janela do `aro` em `silhueta.ts` foi definida como
 * −6 a −16 u **depois** de eu já ver onde o problema estava, e ela exclui
 * justamente o deslocamento 0, onde mora o defeito que sobrou. Calibrei a régua no
 * defeito. Quem pegou foi um subagente olhando a imagem, não o programa.
 *
 * O padrão a copiar existe e é o melhor do repositório: `olhaFixture` em
 * `verificar-pose.ts:646-668`. Ele afirma **duas coisas**, não uma — a fixture
 * reprova no marco certo **e passa em todos os outros** — e a mensagem de falha
 * nomeia as duas causas possíveis sem decidir entre elas.
 *
 * ---------------------------------------------------------------------------
 * A TERCEIRA COLUNA É A QUE TERIA PEGO O BUG REAL
 * ---------------------------------------------------------------------------
 *
 * `coroa.ts` devolvia **144,0 u nas quatro configurações**. Uma afirmação só de
 * "o defeito reprova" ficaria VERDE, porque 144 é maior que todo teto. O que pega
 * é exigir que controles diferentes devolvam números **diferentes** — e é por isso
 * que os dois métodos errados ficaram preservados no código (`MetodoDePreto` e
 * `MetodoDePele`) em vez de apagados: uma régua consertada sem o erro ao lado é
 * uma régua que ninguém consegue conferir que está consertada.
 *
 * ---------------------------------------------------------------------------
 * OS CINCO `CABELOS` SÃO O CONTROLE IDEAL, E SEM UMA LINHA DE ADAPTAÇÃO
 * ---------------------------------------------------------------------------
 *
 * `sondar`, `medirCoroa` e `medirEscala` recebem `Cabelo`, e `CABELOS.coque` **é**
 * um `Cabelo` que nunca passou por arte nenhuma. Se uma régua diz algo absurdo
 * sobre ele, o defeito é da régua e não da arte.
 */

import { mkdirSync } from "fs";

import type { Cabelo, Ponto } from "../../../src/lib/avatar/estilo/cabelo";
import { CABELOS } from "../../../src/lib/avatar/estilo/cabelo";
import { daTela, ESCALA_PADRAO } from "../../../src/lib/avatar/estilo/compositor";
import { CABECA, CAIXA_CABECA, SANGRIA, TRACO } from "../../../src/lib/avatar/estilo/geometria";
import { comprimirNoTeto } from "../estilo/tracar-cabelo";
import { FUNDO, PASTA, PNG_BASE, Y_QUEIXO, paraUnidade } from "./base";
import { mascaraDaPeca } from "./extrair";
import { carregar } from "./pixels";
import { converter } from "./converter";
import { medirCoroa } from "./coroa";
import { medirEscala } from "./escala";
import { PASTA_FIXTURES } from "./fixtures";
import { porqueReprovou } from "./porque-reprovou";
import { sondar } from "./silhueta";

const DESTINO = `${PASTA}/reguas`;

// ---------------------------------------------------------------------------
// O placar
// ---------------------------------------------------------------------------

interface Assercao {
  regua: string;
  papel: "PASSA" | "REPROVA" | "SEPARA";
  o_que: string;
  medido: string;
  ok: boolean;
}

const placar: Assercao[] = [];

function afirmar(
  regua: string,
  papel: Assercao["papel"],
  o_que: string,
  medido: string,
  ok: boolean,
): void {
  placar.push({ regua, papel, o_que, medido, ok });
  console.log(`    ${ok ? "·" : "✗"} [${papel.padEnd(7)}] ${o_que}\n        ${medido}`);
}

/** O registro do número ERRADO, para o conserto poder ser conferido. */
const errosReproduzidos: string[] = [];

// ---------------------------------------------------------------------------
// O controle que injeta o defeito — e ele usa o mecanismo REAL do compositor
// ---------------------------------------------------------------------------

/**
 * `CABELOS.coque` com uma faixa preta atravessando a coroa.
 *
 * A faixa não é pintada por fora: é uma `Extensao`, e quem a torna preta é o
 * `stroke` de `.kk-cabelo-e` (`compositor.ts:170`), que a peça leva no laço
 * inteiro. Ou seja, o controle injeta o defeito pelo mesmo caminho por onde ele
 * aparece de verdade — um retângulo preto desenhado à mão sobre o PNG testaria a
 * régua contra uma imagem que o produto não sabe produzir.
 *
 * ---------------------------------------------------------------------------
 * OS PONTOS SÃO DENSOS, E ISSO NÃO É CAPRICHO
 * ---------------------------------------------------------------------------
 *
 * A primeira versão usava os 4 cantos do retângulo. `laco()` fecha por spline
 * centrípeta, e com o lado longo medindo 204 u contra 12 u de altura a spline dá
 * **overshoot**: os pontos de controle saíram em y 68,2 e 106,8 para uma forma
 * declarada de 81,5 a 93,5. No eixo da cabeça a forma tinha ~32 u de altura, e o
 * que o render mostrava eram DUAS barras de 12 u separadas por fill claro — não
 * a barra grossa de 24 u que o controle prometia.
 *
 * Com um ponto a cada `PASSO_FAIXA` unidades a curvatura local fica pequena e a
 * spline segue o retângulo. A forma passa a ter 12 u de altura de verdade, e os
 * dois strokes de 12 u centrados nas bordas se encontram: **24 u de preto
 * contíguo**, que é o defeito 2 literal — "dois traços encostados".
 */
const Y_FAIXA = CAIXA_CABECA.y0 + 3 * TRACO;
const X0_FAIXA = CAIXA_CABECA.x0 + 80;
const X1_FAIXA = CAIXA_CABECA.x1 - 80;
const PASSO_FAIXA = 24;

const faixaNaCoroa: readonly Ponto[] = (() => {
  const passos = Math.ceil((X1_FAIXA - X0_FAIXA) / PASSO_FAIXA);
  const emX = (k: number) => X0_FAIXA + ((X1_FAIXA - X0_FAIXA) * k) / passos;
  const cima = Array.from({ length: passos + 1 }, (_, k) => ({ x: emX(k), y: Y_FAIXA }));
  const baixo = Array.from({ length: passos + 1 }, (_, k) => ({
    x: emX(passos - k),
    y: Y_FAIXA + TRACO,
  }));
  return [...cima, ...baixo];
})();

const curtoComFaixa: Cabelo = {
  ...CABELOS.coque,
  id: "coque",
  extensoes: [...(CABELOS.coque.extensoes ?? []), { forma: faixaNaCoroa }],
};

/**
 * O CONTROLE NEGATIVO DA BARRA — o defeito reconstruído, depois de o Bloco 4
 * apagar o caminho que o produzia.
 *
 * O defeito era: massa CLIPADA por dentro do crânio, extensão do lado de FORA, e o
 * contorno da cabeça — 12 u centradas na fronteira, desenhado por cima da massa —
 * ficando exposto entre as duas. Cabelo dos dois lados, preto no meio.
 *
 * Com a peça sobreposta esse arranjo deixou de existir, e uma régua sem controle
 * negativo é uma régua que devolve 0% sem ninguém saber se é conserto ou
 * vacuidade — foi exatamente assim que o `cobertos` zerado passou despercebido no
 * Bloco 1. Então ele é reconstruído com o que sobrou: `CABELOS.coque` (touca
 * clipada, cabelo por dentro) mais um **anel** que segue o contorno do crânio por
 * FORA, de meio traço a 40 u de distância.
 *
 * O anel é derivado de `CABECA.contorno`, nunca desenhado à mão — pelo motivo de
 * sempre neste repositório: uma segunda descrição da cabeça divergiria da
 * primeira. Só a metade de cima, que é onde a touca cobre.
 */
function curtoComAnelDe(deU: number, ateU: number): Cabelo {
  const cx = (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2;
  const cy = CAIXA_CABECA.y0 + CAIXA_CABECA.alt * 0.55;
  const alto = CABECA.contorno.filter((p) => p.y <= CAIXA_CABECA.y0 + CAIXA_CABECA.alt * 0.4);
  const ang = (p: Ponto) => Math.atan2(p.y - cy, p.x - cx);
  const ordenado = [...alto].sort((a, b) => ang(b) - ang(a));
  const afastar = (p: Ponto, d: number): Ponto => {
    const vx = p.x - cx;
    const vy = p.y - cy;
    const n = Math.hypot(vx, vy) || 1;
    return { x: p.x + (vx / n) * d, y: p.y + (vy / n) * d };
  };
  const interna = ordenado.map((p) => afastar(p, deU));
  const externa = [...ordenado].reverse().map((p) => afastar(p, ateU));
  return {
    ...CABELOS.coque,
    id: "coque",
    extensoes: [...(CABELOS.coque.extensoes ?? []), { forma: [...interna, ...externa] }],
  };
}

/**
 * Para a BARRA: borda interna a meio traço para FORA da linha de centro. Ela
 * encosta na beira externa do contorno da cabeça sem cobri-lo, e é isso que deixa
 * os 12 u de preto expostos entre a touca (por dentro) e o anel (por fora).
 */
const curtoComAnel = curtoComAnelDe(TRACO / 2, 40);

/**
 * Para o ARO: borda interna `SANGRIA` unidades para DENTRO do crânio.
 *
 * É a emenda enterrada literal — a extensão dilatada 10 u para dentro para não
 * abrir costura, levando contorno de 12 u num trecho que não é borda externa de
 * nada. O traço dela corre concêntrico com o crânio a −10 u, exatamente onde o
 * `aro` olha, e com cabelo dos dois lados.
 */
const curtoComEmenda = curtoComAnelDe(-SANGRIA, 40);

// ---------------------------------------------------------------------------
// Régua 1 — `coroa.ts`
// ---------------------------------------------------------------------------

async function reguaDaCoroa(): Promise<void> {
  console.log(`\n  RÉGUA 1 — coroa.ts  (preto na calota, defeitos 2 e 4)\n`);

  const careca = await medirCoroa(undefined, "r-careca", DESTINO);
  const curto = await medirCoroa(CABELOS.coque, "r-curto", DESTINO);
  const comFaixa = await medirCoroa(curtoComFaixa, "r-faixa", DESTINO);

  // CONTROLE QUE PASSA — e ele descobriu uma coisa sobre a régua.
  //
  // O plano previa "careca → escuros ≈ 0". Não é o que a régua mede: ela conta
  // preto DENTRO da calota, e na careca o arco superior do contorno da cabeça
  // corre por ali, legitimamente. O zero desta régua não é zero, é o valor da
  // careca — e comparar contra 0 seria comparar contra um piso que não existe.
  afirmar(
    "coroa",
    "PASSA",
    "careca é o PISO da régua — o contorno legítimo da silhueta, e nada mais",
    `careca ${careca.escurosA56} px · curto ${curto.escurosA56} px · com faixa ${comFaixa.escurosA56} px` +
      `   (o piso não é 0: o contorno da cabeça mora dentro da calota)`,
    careca.escurosA56 < comFaixa.escurosA56,
  );

  // CONTROLE QUE REPROVA
  afirmar(
    "coroa",
    "REPROVA",
    "faixa preta injetada na coroa faz os escuros subirem acima do piso da careca",
    `${comFaixa.escurosA56} px contra piso ${careca.escurosA56} px  (+${comFaixa.escurosA56 - careca.escurosA56})`,
    comFaixa.escurosA56 > careca.escurosA56,
  );

  // A TERCEIRA COLUNA — controles diferentes têm de dar números DIFERENTES.
  //
  // O teto de 1,5 traço sai da semântica que a própria régua declara ("perto de 12
  // é UM traço; perto de 24 são dois encostados"), e não do valor que eu medi: é o
  // ponto médio entre os dois casos que ela existe para distinguir.
  const dif = Math.abs(comFaixa.faixaU - curto.faixaU);
  const MEIO = TRACO * 1.5;
  afirmar(
    "coroa",
    "SEPARA",
    "faixaU separa UM traço de DOIS encostados — 12 u contra 24 u",
    `curto ${curto.faixaU.toFixed(1)} u · com faixa ${comFaixa.faixaU.toFixed(1)} u · ` +
      `diferença ${dif.toFixed(1)} u  (a fronteira dos dois casos é ${MEIO} u)`,
    curto.faixaU < MEIO && comFaixa.faixaU > MEIO,
  );

  // E o número ERRADO, reproduzido: o método antigo dá o MESMO valor para as duas.
  const curtoLum = await medirCoroa(CABELOS.coque, "r-curto-lum", DESTINO, {
    metodo: "luminancia",
  });
  const faixaLum = await medirCoroa(curtoComFaixa, "r-faixa-lum", DESTINO, {
    metodo: "luminancia",
  });
  const difLum = Math.abs(faixaLum.faixaU - curtoLum.faixaU);
  errosReproduzidos.push(
    `coroa/SEPARA · método "luminancia" (limiar 90 da ARTE aplicado ao RENDER): ` +
      `curto ${curtoLum.faixaU.toFixed(1)} u e com faixa ${faixaLum.faixaU.toFixed(1)} u — ` +
      `diferença ${difLum.toFixed(1)} u contra ${dif.toFixed(1)} u do método por cor. ` +
      `A massa de CABELO[1] (#6E4326, luminância 76,5) inteira conta como traço.`,
  );
}

// ---------------------------------------------------------------------------
// Régua 2 — `silhueta.ts`
// ---------------------------------------------------------------------------

async function reguaDaSilhueta(pecaEntrada: Cabelo): Promise<void> {
  console.log(`\n  RÉGUA 2 — silhueta.ts  (aro da sangria, defeito 3)\n`);

  const curto = await sondar(CABELOS.coque, "r-curto", DESTINO);
  const hoje = await sondar(curtoComEmenda, "r-emenda", DESTINO);

  // O ARO É UM ARCO CONCÊNTRICO, e é isso que o número tem de dizer.
  //
  // O piso não é zero e não deveria ser: `CABELOS.coque` tem a borda de baixo da
  // franja correndo POR DENTRO do crânio, com traço legítimo, e a normal cruza
  // esse traço em alguns pontos. O que distingue os dois casos não é a presença de
  // preto, é a EXTENSÃO dele: a emenda da sangria segue a fronteira em todo o
  // percurso, uma borda de franja a cruza em poucos pontos. A metade do trecho
  // coberto é a fronteira entre "corre junto" e "cruza" — não um teto medido.
  const CONCENTRICO = 0.5;
  afirmar(
    "silhueta",
    "PASSA",
    "CABELOS.coque não tem extensão, então o preto que sobra CRUZA a normal e não corre junto",
    `aro ${(100 * curto.aro.fracao).toFixed(1)}% em ${curto.aro.em.toFixed(0)} u` +
      `   (perímetro ${curto.perimetro}, coberto ${curto.cobertos};` +
      ` o resíduo é o traço da própria franja)`,
    curto.aro.fracao < CONCENTRICO,
  );

  afirmar(
    "silhueta",
    "REPROVA",
    "extensão dilatada `SANGRIA` para dentro põe a emenda enterrada correndo junto com a fronteira",
    `aro ${(100 * hoje.aro.fracao).toFixed(1)}% em ${hoje.aro.em.toFixed(0)} u` +
      `   (${(hoje.aro.fracao / (curto.aro.fracao || 1)).toFixed(0)}× o resíduo do curto)`,
    hoje.aro.fracao > CONCENTRICO,
  );

  // A TERCEIRA COLUNA — e aqui ela afirma o que derrubou a hipótese (b).
  //
  // As duas candidatas do defeito 3 eram pele exposta e degrau de tom. Se a régua
  // separasse os controles pela PELE, a causa seria fresta. Ela separa pelo ARO —
  // a pele fica na mesma ordem de grandeza nos dois enquanto o aro difere por mais
  // de dez vezes. É isso, e não a ausência de pele, que prova que a causa é preto
  // sobre cabelo.
  // A comparação é ABSOLUTA e não por razão, e isso é conserto: com as duas
  // frestas em 0,1% e 0,2%, a razão entre elas é 3,6× — ruído de dois quase-zeros
  // dividido um pelo outro. O que se quer afirmar é que a fresta é desprezível nos
  // dois, e "desprezível" é um número, não uma proporção.
  const razaoAro = hoje.aro.fracao / (curto.aro.fracao || 1);
  const DESPREZIVEL = 0.01;
  afirmar(
    "silhueta",
    "SEPARA",
    "o que separa os dois controles é o ARO, não a fresta — a hipótese (b) cai aqui",
    `aro ${(100 * curto.aro.fracao).toFixed(1)}% → ${(100 * hoje.aro.fracao).toFixed(1)}% (${razaoAro.toFixed(0)}×)` +
      `   ·   fresta ${(100 * curto.pele.fracao).toFixed(1)}% e ${(100 * hoje.pele.fracao).toFixed(1)}%` +
      ` — as duas abaixo de ${100 * DESPREZIVEL}%`,
    razaoAro > 10 && curto.pele.fracao < DESPREZIVEL && hoje.pele.fracao < DESPREZIVEL,
  );

  const hojeIgual = await sondar(pecaEntrada, "r-peca-igual", DESTINO, {
    metodoPele: "igualdade",
  });
  const hojeCerto = await sondar(pecaEntrada, "r-peca-certo", DESTINO);
  // O erro se mede na pele BRUTA e não na fresta, e a distinção importa: a fresta
  // olha a primeira amostra fora do traço, onde os dois métodos concordam porque
  // ali não HÁ traço. O erro morava no resto da sonda — os 5 066 de 5 080 px
  // "iguais à careca" que estavam sobre PRETO.
  errosReproduzidos.push(
    `silhueta · método "igualdade" ("igual à careca" basta para dizer pele): ` +
      `pele bruta ${(100 * hojeIgual.peleBruta).toFixed(1)}% de todas as amostras, contra ` +
      `${(100 * hojeCerto.peleBruta).toFixed(1)}% do método que exige superfície do crânio. ` +
      `A diferença é traço coincidindo com traço, lido como fresta.`,
  );

  // ------------------------------------------------------------- a barra
  //
  // A RÉGUA QUE NASCE VERMELHA (regra 2 do plano). Ela mede o contorno do crânio
  // aparecendo POR DENTRO do cabelo, em deslocamento 0 — que é justamente o que a
  // janela do `aro` exclui. Ela roda na build de HOJE, antes de A ou B existirem,
  // e tem de acusar os 6 u que sobraram.
  console.log(`\n  RÉGUA 5 — a BARRA ENTERRADA  (preto com cabelo dos dois lados)\n`);

  const comAnel = await sondar(curtoComAnel, "r-barra-anel", DESTINO);
  const careca = await sondar(undefined, "r-barra-careca", DESTINO);
  const sobreposta = await sondar(pecaEntrada, "r-barra-peca", DESTINO);

  // O CONTROLE QUE REPROVA precisou ser CONSTRUÍDO, e isso é consequência do
  // Bloco 4: o caminho que produzia o defeito — massa clipada mais extensão do
  // lado de fora, com o contorno da cabeça exposto entre as duas — foi apagado.
  // Uma régua sem controle negativo é uma régua que diz 0% e ninguém sabe se é
  // conserto ou vacuidade; foi exatamente assim que o `cobertos` zerado passou
  // despercebido. Ver `curtoComAnel`.
  afirmar(
    "barra",
    "REPROVA",
    "touca clipada + anel por fora deixa o contorno do crânio exposto ENTRE os dois",
    `${(100 * comAnel.barra.fracao).toFixed(1)}% do trecho coberto, a pior com ` +
      `${comAnel.barra.espessuraU.toFixed(1)} u (de ${comAnel.barra.de.toFixed(1)} a ${comAnel.barra.ate.toFixed(1)})` +
      `   ← o defeito que o Doug reprovou, reconstruído`,
    comAnel.barra.fracao > 0.5,
  );

  // O CONTROLE QUE PASSA É A CARECA, e ele é o que separa esta régua da anterior.
  //
  // Na careca o contorno da cabeça está lá, inteiro e visível — e é a borda
  // externa, com fundo de um lado. Uma régua que medisse "preto perto da
  // fronteira" acusaria 12 u aqui. A que mede "preto com cabelo dos dois lados"
  // tem de dar ZERO, porque não há cabelo nenhum.
  afirmar(
    "barra",
    "PASSA",
    "a careca não tem barra enterrada — o contorno dela é borda externa, não defeito",
    `careca ${(100 * careca.barra.fracao).toFixed(1)}%, espessura ${careca.barra.espessuraU.toFixed(1)} u` +
      `   (o contorno da cabeça está lá, inteiro, e não conta)`,
    careca.barra.fracao === 0,
  );

  afirmar(
    "barra",
    "SEPARA",
    "a peça SOBREPOSTA fica muito abaixo do controle — é o conserto do Bloco 4, medido",
    `anel ${(100 * comAnel.barra.fracao).toFixed(1)}%  →  sobreposta ` +
      `${(100 * sobreposta.barra.fracao).toFixed(1)}%   (traço nominal ${TRACO} u)`,
    sobreposta.barra.fracao < comAnel.barra.fracao / 2,
  );
}

// ---------------------------------------------------------------------------
// Régua 3 — `escala.ts`
// ---------------------------------------------------------------------------

async function reguaDaEscala(): Promise<void> {
  console.log(`\n  RÉGUA 3 — escala.ts  (os 92%, medidos no render)\n`);

  const m = await medirEscala(`${PASTA}/entrada.png`);
  const hCem = m.alturaNoQuadro(m.carecaCem);
  const h92 = m.alturaNoQuadro(m.careca92);

  afirmar(
    "escala",
    "PASSA",
    "careca a 100% e a 92% dão as alturas conhecidas no quadro 56 × 70",
    `${hCem.toFixed(1)} px → ${h92.toFixed(1)} px  (razão ${(h92 / hCem).toFixed(4)}, esperado 0,92)`,
    Math.abs(h92 / hCem - 0.92) < 0.01,
  );

  afirmar(
    "escala",
    "REPROVA",
    "a peça CRUA a 100% encosta no teto do quadro — o viewport corta sem avisar",
    `tinta começa em y ${m.pecaCem.y0.toFixed(1)}   ${m.pecaCem.tocaOTeto ? "✗ ENCOSTA" : "cabe"}` +
      `   (pico da peça ${m.picoAntes.toFixed(1)} u)`,
    m.pecaCem.tocaOTeto,
  );

  afirmar(
    "escala",
    "SEPARA",
    "a MESMA peça a 92% deixa de tocar — a régua separa as duas escalas",
    `a 92% a tinta começa em y ${m.peca92.y0.toFixed(1)}   ${m.peca92.tocaOTeto ? "✗ ENCOSTA" : "· cabe"}`,
    !m.peca92.tocaOTeto && m.peca92.y0 > 0,
  );
}

// ---------------------------------------------------------------------------
// Régua 6 — `comprimirNoTeto`: o teto é do QUADRO, não do sistema interno
// ---------------------------------------------------------------------------

/**
 * O DEFEITO QUE ESTA RÉGUA EXISTE PARA IMPEDIR DE VOLTAR.
 *
 * `TETO_Y = 8` foi medido quando o produto entregava a 100%. Desde o Bloco 5 ele
 * entrega a 92%, e a figura é reancorada: o topo do quadro passou a ser
 * `y ≈ −72` em coordenada interna. Ler o teto no sistema errado comprime peça que
 * cabe — a `entrada` sobra 33 unidades e vinha sendo achatada por `k = 0,445`.
 *
 * As três asserções são o padrão da rota, e o que separa esta régua de uma que
 * devolve "1" para tudo é a terceira: uma peça que **de fato** excede o teto na
 * escala de entrega continua sendo comprimida. Sem esse controle, "não comprimir
 * nunca" passaria nas duas primeiras.
 */
function reguaDaCompressao(): void {
  console.log(`\n  RÉGUA 6 — comprimirNoTeto  (o teto é do quadro, e o quadro encolheu)\n`);

  // O pico real da `entrada`, medido pelo conversor e registrado no Bloco 7.
  const PICO_DA_ENTRADA = -38.9;
  // Um pico que não cabe nem a 92%: o topo do quadro é −72,4 em interna.
  const PICO_QUE_NAO_CABE = -120;

  const kCem = comprimirNoTeto(PICO_DA_ENTRADA, 1);
  const k92 = comprimirNoTeto(PICO_DA_ENTRADA, ESCALA_PADRAO);
  const kFundo = comprimirNoTeto(PICO_QUE_NAO_CABE, ESCALA_PADRAO);
  const tetoInterno = daTela({ y: 8 }, ESCALA_PADRAO).y;

  afirmar(
    "compressão",
    "REPROVA",
    "lendo o teto no sistema INTERNO, a peça da `entrada` é comprimida — o defeito",
    `pico ${PICO_DA_ENTRADA} u a escala 1  →  k = ${kCem.toFixed(3)}  ` +
      `(a peça guarda ${(100 * ((45.5 - 8) / (45.5 - PICO_DA_ENTRADA))).toFixed(1)}% da ponta)`,
    kCem < 0.99,
  );

  afirmar(
    "compressão",
    "PASSA",
    "lendo o teto no QUADRO de entrega, a mesma peça não é tocada",
    `teto a ${(100 * ESCALA_PADRAO).toFixed(0)}% = y ${tetoInterno.toFixed(1)} u em interna;  ` +
      `pico ${PICO_DA_ENTRADA} sobra ${(PICO_DA_ENTRADA - tetoInterno).toFixed(1)} u  →  k = ${k92.toFixed(3)}`,
    k92 === 1,
  );

  afirmar(
    "compressão",
    "SEPARA",
    "a guarda continua inteira: um pico que NÃO cabe nem a 92% ainda é comprimido",
    `pico ${PICO_QUE_NAO_CABE} u a ${(100 * ESCALA_PADRAO).toFixed(0)}%  →  k = ${kFundo.toFixed(3)}`,
    kFundo < 0.99,
  );

  errosReproduzidos.push(
    `compressão · teto no sistema interno: k = ${kCem.toFixed(3)} contra ${k92.toFixed(3)} do teto no quadro`,
  );
}

// ---------------------------------------------------------------------------
// Régua 7 — o salpico de teal, e a barba que ele desenhava
// ---------------------------------------------------------------------------

/**
 * O DEFEITO QUE O OLHO DO DOUG PEGOU E NENHUMA RÉGUA PEGAVA.
 *
 * *"há cabelo na linha do queixo, parece ter barba"* — e a régua de vazamento
 * respondia **0 px**, porque media ABAIXO de `Y_QUEIXO`, faixa que `limitar` já
 * zera. Vacuidade, o mesmo modo de falha do `cobertos = 0` de `silhueta.ts`.
 *
 * A causa, medida: 313 salpicos de teal (o maior com 21 px, contra 94 919 da peça)
 * ancoravam o contorno do queixo do boneco, e a inundação o percorria inteiro.
 *
 * A terceira asserção é a que importa: ela exige que a limpeza **não coma a mecha
 * legítima da bochecha**. Uma régua que só afirmasse "o queixo esvaziou" ficaria
 * verde com uma limpeza que apagasse a peça toda.
 */
async function reguaDoSalpico(): Promise<void> {
  console.log(`\n  RÉGUA 7 — o salpico de teal  (a barba no queixo)\n`);

  const arte = await carregar(`${PASTA}/entrada.png`, FUNDO);
  const base = await carregar(PNG_BASE, FUNDO);
  const comSalpico = mascaraDaPeca(arte, base, true, true);
  const limpo = mascaraDaPeca(arte, base, true, false);

  /** Pixels da máscara numa faixa de altura, em unidades do `viewBox`. */
  const naFaixa = (m: Uint8Array, y0: number, y1: number) => {
    let c = 0;
    for (let py = 0; py < arte.h; py++)
      for (let px = 0; px < arte.w; px++) {
        const u = paraUnidade(px, py);
        if (u.y >= y0 && u.y <= y1 && m[py * arte.w + px]) c++;
      }
    return c;
  };

  // A faixa do queixo: da boca até onde a região do corpo começa a proteger.
  const QUEIXO: [number, number] = [307, Y_QUEIXO];
  const BOCHECHA: [number, number] = [200, 307];

  const qAntes = naFaixa(comSalpico.peca, ...QUEIXO);
  const qDepois = naFaixa(limpo.peca, ...QUEIXO);
  const bAntes = naFaixa(comSalpico.peca, ...BOCHECHA);
  const bDepois = naFaixa(limpo.peca, ...BOCHECHA);

  afirmar(
    "salpico",
    "REPROVA",
    "com o salpico, o contorno do QUEIXO do boneco entra na peça — a barba",
    `${qAntes} px na faixa y ${QUEIXO[0]}–${QUEIXO[1].toFixed(0)}` +
      `   (o laço fecha por baixo do rosto e o preenchimento pinta o queixo)`,
    qAntes > 2000,
  );

  afirmar(
    "salpico",
    "PASSA",
    "limpo o salpico, o queixo esvazia",
    `${qAntes} px → ${qDepois} px  (−${(100 * (1 - qDepois / qAntes)).toFixed(1)}%)`,
    qDepois < qAntes * 0.1,
  );

  afirmar(
    "salpico",
    "SEPARA",
    "e a mecha da BOCHECHA sobrevive — a limpeza não come desenho legítimo",
    `bochecha ${bAntes} px → ${bDepois} px  (guardou ${(100 * (bDepois / bAntes)).toFixed(1)}%)`,
    bDepois > bAntes * 0.6,
  );

  errosReproduzidos.push(
    `salpico · sem limpar: queixo com ${qAntes} px de contorno do boneco dentro da peça, contra ${qDepois} px depois`,
  );
}

// ---------------------------------------------------------------------------
// Régua 4 — `porque-reprovou.ts`
// ---------------------------------------------------------------------------

async function reguaDoPorque(): Promise<void> {
  console.log(`\n  RÉGUA 4 — porque-reprovou.ts  (de que COR é a reprovação)\n`);

  const um = await porqueReprovou(`${PASTA}/entrada.png`);
  const dois = await porqueReprovou(`${PASTA}/entrada-2.png`);
  const efe = await porqueReprovou(`${PASTA_FIXTURES}/f-corpo.png`);

  afirmar(
    "porque",
    "PASSA",
    "entrada.png: o que mudou nas protegidas é REPINTURA, não peça",
    `repintura ${um.fracao.repintura.toFixed(1)}% · peça ${um.fracao.peca.toFixed(1)}% · ` +
      `não explicado ${um.fracao.outro.toFixed(1)}%  (${um.total} px)`,
    um.fracao.repintura > 90,
  );

  afirmar(
    "porque",
    "REPROVA",
    "entrada-2.png: o que mudou é a PRÓPRIA PEÇA — o Gate −1 reprova por estar certa",
    `peça ${dois.fracao.peca.toFixed(1)}% · repintura ${dois.fracao.repintura.toFixed(1)}%  (${dois.total} px)`,
    dois.fracao.peca > 90,
  );

  // A fixture F é um quadrado PRETO de 14 u colado no tronco. Ela não é peça e não
  // é repintura: é boneco redesenhado, e tem de cair em "preto novo" — nunca em
  // "ciano", que é o balde da peça legítima.
  const pretoNovo = efe.conta["corpo"]["preto novo"];
  const ciano = efe.conta["corpo"].ciano;
  const lado = Math.round(14 * 1.2);
  afirmar(
    "porque",
    "SEPARA",
    `fixture F (quadrado preto de 14 u no tronco) cai em "preto novo", nunca em "ciano"`,
    `preto novo ${pretoNovo} px · ciano ${ciano} px  ` +
      `(o quadrado tem ${lado}×${lado} = ${lado * lado} px)`,
    pretoNovo > 0 && ciano === 0 && Math.abs(pretoNovo - lado * lado) <= lado * 4,
  );
}

// ---------------------------------------------------------------------------

async function principal(): Promise<void> {
  mkdirSync(DESTINO, { recursive: true });
  console.log(`BLOCO 1 — AS RÉGUAS, CONFERIDAS CONTRA CONTROLES\n`);
  console.log(`  Cada régua afirma TRÊS coisas: um controle que passa, um que reprova,`);
  console.log(`  e — a que teria pego o bug real — que os dois dão números DIFERENTES.`);

  const c = await converter(`${PASTA}/entrada.png`);

  await reguaDaCoroa();
  await reguaDaSilhueta(c.peca);
  await reguaDaEscala();
  await reguaDoPorque();
  reguaDaCompressao();
  await reguaDoSalpico();

  console.log(`\n\n  O NÚMERO ERRADO, REPRODUZIDO — é o que prova que o conserto conserta\n`);
  for (const e of errosReproduzidos) console.log(`    ${e}\n`);

  const falhas = placar.filter((a) => !a.ok);
  console.log(`\n  PLACAR   ${placar.length - falhas.length} de ${placar.length} asserções passando`);
  if (falhas.length) {
    console.log(`\n  AS QUE FALHARAM:`);
    for (const f of falhas) console.log(`    ✗ ${f.regua}/${f.papel}  ${f.o_que}\n        ${f.medido}`);
    process.exitCode = 1;
  }
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
