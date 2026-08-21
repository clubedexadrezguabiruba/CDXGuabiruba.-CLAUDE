/**
 * O SLOT DE ROSTO — e a primeira peça dele é a mais difícil de propósito.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE É CÓDIGO E NÃO ARTE IMPORTADA
 * ---------------------------------------------------------------------------
 *
 * A rota de arte (`docs/avatar/19-rota-de-arte-runbook.md`) manda o Doug editar
 * sobre um render do próprio compositor, e o **Gate −1** prova que o boneco não se
 * mexeu comparando as regiões protegidas — das quais o rosto é a principal.
 * Mandar arte de rosto por lá seria pedir que o gate reprove a si mesmo. Então
 * esta peça é paramétrica, e o plano (doc 21 §641) diz isso com todas as letras.
 *
 * Isso a põe na família que o Doug **já reprovou uma vez**: os dois cabelos
 * paramétricos, `coque` e `moicano`, levaram *"tudo muito quadrado, sem toque
 * humano"*. A causa está nomeada em `cabelo.ts:192-197` e é de mecanismo, não de
 * gosto — o `DEGRAU` constante produzia uma faixa **de espessura constante,
 * paralela em todo o percurso**, e espessura constante lê como impressão gráfica.
 *
 * ---------------------------------------------------------------------------
 * A RECEITA: DUAS FORMAS CHEIAS, E A BANDA PRETA É A DIFERENÇA ENTRE ELAS
 * ---------------------------------------------------------------------------
 *
 * É a mesma receita que fez `chanel` e `assimetrico` ficarem bonitas, trazida da
 * arte para o código: **a banda preta não é um `stroke`, é a diferença entre duas
 * formas cheias** (IoU do preto 80,1% contra 34,4% da família sintetizada). Um
 * `stroke` dá 12 u constantes e espalhamento zero; a diferença de duas formas dá a
 * espessura que quem desenhou quis, ponto a ponto.
 *
 *   forma 1 — a MASSA, em `var(--av-linha)`, **com** o traço do compositor;
 *   forma 2 — o NÚCLEO, em `var(--av-cabelo, …)`, com `semTraco`.
 *
 * O núcleo **não é uma segunda tabela**: cada ponto da massa declara o próprio
 * `recuo`, e o núcleo é a massa recuada por ele ponto a ponto. É a resposta direta
 * ao defeito do `DEGRAU`: uma tabela, uma fronteira, e a banda variando porque
 * alguém escreveu que ela varia — não porque duas curvas paralelas sobraram.
 *
 * As MECHAS são **furos no núcleo**, com winding invertido, por onde a massa preta
 * reaparece. Espessura livre, afinando até zero, sem `stroke` nenhum — o que um
 * traço não consegue, porque `stroke-linecap: round` põe um disco de meio traço em
 * toda ponta e mecha que afina até morrer é impossível como traço.
 *
 * ⚠️ **Furo é a primeira região com furo do sistema.** `fill-rule` não aparece em
 * lugar nenhum do repositório, e winding invertido errado faz a mecha **sumir em
 * silêncio**. Por isso `pontosDoNucleo` **lança** quando um ponto recuado cai fora
 * da massa, e `pathDoNucleo` reorienta cada furo pelo sinal da área em vez de
 * confiar em quem escreveu a tabela. Mecanismo, não disciplina.
 *
 * ---------------------------------------------------------------------------
 * O QUE A MEDIÇÃO DO CORREDOR MUDOU NO PLANO — e é a decisão mais importante daqui
 * ---------------------------------------------------------------------------
 *
 * O plano previa a boca como **furo** na massa, com o anel de 12 u virando o
 * contorno da abertura da barba. Medido altura a altura (`.scratch/estilo/
 * _corredor.ts`), isso é **geometricamente impossível nesta base**, e não por pouco:
 *
 *  - a janela da boca veta x 247–333 entre y 265 e 337 (a boca dilatada, mais meio
 *    traço);
 *  - a folga de 24 u aos olhos veta x 164–262 e 319–417 até y ~300.
 *
 * Os dois vetos **se tocam**: entre y 265 e 300 não sobra corredor nenhum entre o
 * olho e a janela, dos dois lados. A massa só consegue atravessar o centro do rosto
 * **por baixo da janela**, de y 337 para baixo. Um anel fechado em volta da boca
 * exigiria material acima dela ligado às bochechas, e esse material não tem por
 * onde passar.
 *
 * Consequência, e ela é boa: **o bigode não é um enfeite da barba, é a única peça
 * que consegue existir acima da boca**, numa ilha de 57 u (x 262–319) entre os dois
 * olhos. É por isso que ele é um subpath separado e não um lóbulo da massa.
 *
 * A segunda consequência é o **GIRO virando assimetria obrigatória**: na altura da
 * boca o flanco esquerdo tem 200,8 u e o direito 144,2 u, e no corredor acima dela
 * a bochecha esquerda oferece ~80 u contra ~21 u da direita. Barba simétrica não
 * briga com a base — ela não cabe nela.
 *
 * ---------------------------------------------------------------------------
 * `{t, y}` ATÉ O QUEIXO, ABSOLUTO ABAIXO DELE — e a troca é medida, não estética
 * ---------------------------------------------------------------------------
 *
 * A peça nasce em `{t, y}` pela mesma razão do cabelo: `t` é fração da largura da
 * cabeça naquela altura, então o `GIRO` chega nela sem ninguém somar deslocamento.
 *
 * Mas `bordasEm(y)` **devolve a caixa da cabeça** quando `y` sai do contorno
 * (`geometria.ts:1072`), e o contorno acaba em y 347,2. Um ponto `{t, y}` em y 360
 * não erra: ele mente, e mente calado — 0,5 vira o meio da CAIXA, não o meio de
 * nada. Uma barba que desce abaixo do queixo (a `cunha`) cairia inteira nessa
 * mentira. Por isso o ponto abaixo do queixo é `{x, y}`, exatamente como a crista
 * do moicano é absoluta, e `pontosForaDoContorno` reprova quem misturar os dois
 * errado.
 */

import {
  CABECA,
  OLHO,
  OLHO_CX_DIR,
  OLHO_CX_ESQ,
  OLHO_CY_DIR,
  OLHO_CY_ESQ,
  SANGRIA,
  TRACO,
  amostrarSpline,
  bordasEm,
} from "./geometria";
import { ateAPoligonal, dentroDe, laco, ponto, type Ponto } from "./cabelo";
import type { PecaDeRosto } from "./tipos";

// ---------------------------------------------------------------------------
// Os tipos
// ---------------------------------------------------------------------------

/**
 * UM PONTO DA MASSA, e ele carrega a espessura da banda preta naquele lugar.
 *
 * `recuo` é o quanto o núcleo entra para dentro da massa ali. A banda preta que se
 * vê é `recuo + TRACO / 2`: o traço do compositor é centrado na fronteira, então
 * meio traço já é preto por fora do recuo.
 *
 * As duas formas do ponto são exclusivas e a segunda existe pelo motivo escrito no
 * topo: abaixo de y 347,2 `bordasEm` deixa de descrever a cabeça.
 */
export type PontoDaMassa =
  | { readonly t: number; readonly y: number; readonly recuo: number }
  | { readonly x: number; readonly y: number; readonly recuo: number };

/** Um ponto sem recuo — furo de mecha e as réguas. */
export type PontoSimples = { readonly t: number; readonly y: number } | Ponto;

export interface Barba {
  /** Slug do catálogo. Ainda NÃO entra em `ROSTOS` — ver o plano, §5. */
  id: string;
  /** Nome que o aluno lê. */
  nome: string;
  /** Em que esta direção diverge das outras. Prosa, e a folha imprime. */
  eixo: string;
  /** O lóbulo da massa, laço fechado. */
  massa: readonly PontoDaMassa[];
  /**
   * OS FUROS DE MECHA no núcleo. Winding é reorientado no emissor.
   *
   * Eles não são uma camada: são buracos por onde a massa preta de baixo aparece.
   * É o que dá mecha afinando até zero sem `stroke`.
   */
  mechas?: readonly (readonly PontoSimples[])[];
  /**
   * O BIGODE — a ilha entre os dois olhos, e a única peça possível acima da boca.
   *
   * Sai como subpath das MESMAS duas formas (`M…Z M…Z`), então ele **não custa
   * forma do orçamento** — o mesmo mecanismo de `Cabelo.claras`. É por isso que a
   * versão com e a versão sem custam igual, e é por isso que a escolha entre as
   * duas é do olho do Doug e não do orçamento.
   */
  bigode?: readonly PontoDaMassa[];
}

// ---------------------------------------------------------------------------
// As âncoras que as réguas medem
// ---------------------------------------------------------------------------

/** Metade do traço: o quanto a tinta excede a fronteira declarada, em todo lado. */
const MEIO = TRACO / 2;

/**
 * A JANELA DA BOCA — onde a barba não põe tinta, e o sorriso sobrevive.
 *
 * A barba é desenhada DEPOIS da boca (`compositor.ts:1005` → `:1039`), então toda
 * tinta sobre ela a apaga — e o sorriso é a única expressão do boneco. Os números
 * são a caixa de tinta da boca dilatada: 16 u lateral, **26 u vertical**. Os 26
 * são 1,6 px a 32 e 2,8 px a 56, que é o piso de pele entre duas marcas pretas que
 * `FOLGA_ROSTO` já fixou um slot acima.
 */
export const JANELA_DA_BOCA = { x0: 252.9, x1: 327.1, y0: 270.2, y1: 331.1 } as const;

/** A folga mínima a cada olho, medida separadamente — o `GIRO` faz os dois diferirem. */
export const FOLGA_DO_OLHO = 24;

/**
 * OS DOIS PISOS QUE DECIDEM SE A BARBA CABE — e eles são parâmetro, não constante.
 *
 * Medido na etapa 1: uma barba de **terço inferior** — a que de fato lê como barba,
 * com massa em volta da boca — só existe se os dois caírem juntos (boca 26→6, olho
 * 24→12). Aí a pele em volta da boca vai a 6 u = **0,37 px a 32**, sub-pixel nos dois
 * tamanhos do produto, e o sorriso passa a depender de antialiasing.
 *
 * Isso é decisão do Doug e não da régua, então a folha 1 roda uma coluna com os
 * pisos rebaixados **por parâmetro** e ele vê o custo antes de escolher. Os pisos de
 * produção não se mexem enquanto ele não decidir — passar `pisos` a `amarrasDaBarba`
 * imprime um aviso dizendo em voz alta que aquela coluna não é peça aprovável.
 */
export interface PisosDoRosto {
  /** Pele mínima entre a tinta da peça e a da boca, em unidades. */
  boca: number;
  /** Pele mínima até cada cápsula de olho, em unidades. */
  olho: number;
}

/** Os pisos de produção. Trocar aqui é trocar a lei; passar `pisos` é medir o custo. */
export const PISOS_DE_PRODUCAO: PisosDoRosto = { boca: 26, olho: FOLGA_DO_OLHO };

/** As duas cápsulas dos olhos, como caixas. */
const OLHOS = [
  {
    lado: "esq" as const,
    x0: OLHO_CX_ESQ - OLHO.w / 2,
    x1: OLHO_CX_ESQ + OLHO.w / 2,
    y0: OLHO_CY_ESQ - OLHO.h / 2,
    y1: OLHO_CY_ESQ + OLHO.h / 2,
  },
  {
    lado: "dir" as const,
    x0: OLHO_CX_DIR - OLHO.w / 2,
    x1: OLHO_CX_DIR + OLHO.w / 2,
    y0: OLHO_CY_DIR - OLHO.h / 2,
    y1: OLHO_CY_DIR + OLHO.h / 2,
  },
];

// ---------------------------------------------------------------------------
// De tabela a coordenada
// ---------------------------------------------------------------------------

const ehRelativo = (p: PontoDaMassa | PontoSimples): boolean => "t" in p;

/** Um ponto da tabela em coordenada absoluta. */
const emAbsoluto = (p: PontoDaMassa | PontoSimples): Ponto =>
  "t" in p ? ponto({ t: p.t, y: p.y }) : { x: p.x, y: p.y };

/** Área com sinal (shoelace). Em y-para-baixo, positivo é horário na tela. */
function areaComSinal(pts: readonly Ponto[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
  }
  return a / 2;
}

/** O laço da massa em coordenada absoluta. */
export function pontosDaMassa(b: Barba): Ponto[] {
  return b.massa.map(emAbsoluto);
}

/**
 * O NÚCLEO — a massa recuada ponto a ponto pelo `recuo` que cada um declara.
 *
 * A normal de cada vértice é a média das normais das duas arestas vizinhas. O
 * SENTIDO dela não é deduzido do sinal da área e sim **verificado**: recua-se para
 * um lado, conta-se quantos pontos caíram dentro da massa, e inverte-se se a
 * maioria caiu fora. Deduzir daria a resposta certa hoje e a errada no dia em que
 * alguém escrever a tabela no sentido contrário — e o sintoma seria a peça inteira
 * virando um borrão marrom por cima do preto, sem nenhum gate acusar.
 *
 * **Lança** se, depois disso, algum ponto ainda estiver fora: recuo maior que a
 * meia-largura local dobra a curva sobre si mesma, e o núcleo vaza da massa como
 * tinta marrom sem borda — o mesmo defeito que `contencaoDaClara` pega no cabelo.
 */
export function pontosDoNucleo(b: Barba, massa = b.massa): Ponto[] {
  const pts = massa.map(emAbsoluto);
  const N = pts.length;
  const laçoInteiro = pontosDaMassa(b);

  const normais = pts.map((p, i) => {
    const a = pts[(i - 1 + N) % N];
    const c = pts[(i + 1) % N];
    const nrm = (u: Ponto, v: Ponto) => {
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      const h = Math.hypot(dx, dy) || 1;
      return { x: dy / h, y: -dx / h };
    };
    const n1 = nrm(a, p);
    const n2 = nrm(p, c);
    const sx = n1.x + n2.x;
    const sy = n1.y + n2.y;
    const h = Math.hypot(sx, sy) || 1;
    return { x: sx / h, y: sy / h };
  });

  const recuar = (s: number) =>
    pts.map((p, i) => ({
      x: p.x + s * normais[i].x * massa[i].recuo,
      y: p.y + s * normais[i].y * massa[i].recuo,
    }));

  const dentro = (cand: Ponto[], contra: Ponto[]) =>
    cand.filter((p) => dentroDe(contra, p)).length;

  const contra = massa === b.massa ? laçoInteiro : pts;
  const a = recuar(1);
  const nucleo = dentro(a, contra) >= Math.ceil(N / 2) ? a : recuar(-1);

  const fora = nucleo.filter((p) => !dentroDe(contra, p));
  if (fora.length) {
    throw new Error(
      `rosto "${b.id}": ${fora.length} de ${N} pontos do núcleo caem FORA da massa ` +
        `(${fora.map((p) => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" · ")}). ` +
        `Recuo maior que a meia-largura local dobra a curva sobre si mesma, e o ` +
        `núcleo sai como tinta sem borda por cima do preto — invisível para o ` +
        `orçamento, para os bytes e para o contrato. ` +
        `\`.scratch/estilo/_recuo-maximo.ts\` diz quanto cada ponto aguenta.`,
    );
  }

  // TODO PONTO DENTRO NÃO BASTA, e o caso que escapa é o que mais suja o desenho:
  // num trecho estreito os recuos das duas margens se cruzam, cada ponto continua
  // dentro da massa, e o laço fica com um NÓ — sob `nonzero` o pedaço cruzado
  // deixa de pintar e abre um rasgo marrom-sobre-preto no meio da peça. Área com
  // sinal pega isso de graça: um laço recuado tem o mesmo sentido e área MENOR.
  const aMassa = areaComSinal(pts);
  const aNucleo = areaComSinal(nucleo);
  if (Math.sign(aNucleo) !== Math.sign(aMassa) || Math.abs(aNucleo) >= Math.abs(aMassa)) {
    throw new Error(
      `rosto "${b.id}": o núcleo tem área ${aNucleo.toFixed(0)} contra ${aMassa.toFixed(0)} da ` +
        `massa. Um laço recuado tem o MESMO sentido e área MENOR — sentido trocado ou ` +
        `área maior é o laço dobrado sobre si mesmo num trecho estreito, e ali ele para ` +
        `de pintar em silêncio.`,
    );
  }
  return nucleo;
}

/**
 * UM FURO, com o winding oposto ao do laço que o hospeda.
 *
 * Reorientar aqui em vez de cobrar de quem escreve a tabela é a diferença entre um
 * defeito que reprova e um que **some em silêncio**: sob `nonzero`, um subpath com
 * o mesmo winding do hospedeiro simplesmente pinta junto, e a mecha não aparece.
 */
function furo(hospedeiro: readonly Ponto[], pts: readonly Ponto[]): string {
  const mesmo = Math.sign(areaComSinal(pts)) === Math.sign(areaComSinal(hospedeiro));
  return laco(mesmo ? [...pts].reverse() : pts);
}

// ---------------------------------------------------------------------------
// A peça
// ---------------------------------------------------------------------------

/**
 * A BARBA COMO `PecaSobreposta` — duas formas, três `<path>`.
 *
 * Medido em `.scratch/estilo/sondas-rosto.ts` (P3): base + `chanel` = 23 formas, e
 * esta receita leva o composto a **26**. O 26 já foi teto e não é mais: o orçamento
 * hoje é `ORCAMENTO_COM_ROSTO` (`cabelo.ts`), que soma as 5 formas declaradas de
 * `CUSTO_DE_SOBREPOSTA` — contra ele, **sobram 5**. A folga existe porque a peça de
 * três formas com núcleo sem traço (3 + 2 = 5) é o próximo degrau real, não porque
 * esta receita precise dela.
 *
 * ⚠️ **Esta é a barba PARAMÉTRICA, e ela não recebeu o tom contínuo do Bloco 5.**
 * O tom (`TomDaPeca`, `tipos.ts`) vem da esteira de arte, que mede o claro-escuro
 * de um raster desenhado — não há raster aqui, e forma calculada não tem tom para
 * medir. Ela continua sendo massa + núcleo, que é o desenho que ela sempre foi.
 */
export function pecaDeRosto(b: Barba, comBigode = true): PecaDeRosto {
  const massa = pontosDaMassa(b);
  const nucleo = pontosDoNucleo(b);

  const dMassa = [laco(massa), ...(comBigode && b.bigode ? [laco(b.bigode.map(emAbsoluto))] : [])];
  const dNucleo = [
    laco(nucleo),
    ...(b.mechas ?? []).map((m) => furo(nucleo, m.map(emAbsoluto))),
    ...(comBigode && b.bigode ? [laco(pontosDoNucleo(b, b.bigode))] : []),
  ];

  return {
    id: comBigode ? b.id : `${b.id}-sem-bigode`,
    nome: comBigode ? b.nome : `${b.nome} (sem bigode)`,
    // O CABELO VEM POR CIMA, e esta barba declara o mesmo que as de arte declaram.
    //
    // Ela nunca entrou em `ROSTOS` e talvez não entre — mas é barba, e duas barbas no
    // mesmo repositório vestindo lados opostos do cabelo é o tipo de divergência que
    // ninguém vê até alguém trocar uma pela outra numa folha. Pedido do Doug em
    // 2026-08-19; o campo e o porquê moram em `PecaDeRosto` (`tipos.ts`).
    cabeloPorCima: true,
    formas: [
      { d: dMassa.join(" "), cor: "var(--av-linha)" },
      // O NÚCLEO É `--av-cabelo` COM FALLBACK CASTANHO, E O TOM ESCURO ESTÁ VETADO
      // COM NÚMERO — para ninguém repropor `--av-cabelo-s` como "combina melhor".
      //
      // A proposta é natural: o cabelo pinta a banda de baixo em `--av-cabelo-s`
      // (`compositor.ts:461-462`), então casar a barba com ela pareceria coerência.
      // Medido, ela custa as duas coisas que esta peça tem para dar:
      //
      //  - **o contraste massa↔núcleo despenca** — de 85,7 para 70,6 no cabelo preto
      //    e de 134,3 para 109,9 no castanho, 18 a 24% justamente nas duas cores
      //    mais escolhidas. A banda preta É a peça (é o IoU 80,1% × 34,4%): apagar o
      //    contraste apaga o desenho;
      //  - **`--av-cabelo-s` não tem fallback declarado em lugar nenhum.** Um
      //    `fill:var(--av-cabelo-s)` sem valor cai em preto, que é a cor da massa —
      //    núcleo preto sobre massa preta é uma mancha sólida, e ela passa em todas
      //    as réguas desta etapa: elas medem pontos, não cor.
      //
      //    O caminho pelo qual isso acontecia no CARECA está consertado desde
      //    2026-08-20: `compositor.ts:1039` emite as duas variáveis quando há
      //    `modeloCabelo` **ou** quando a peça de rosto declara `formas`, e
      //    `rosto-cor.test.ts` mede. O que continua de pé é o motivo do veto — a
      //    variável sem fallback é frágil por natureza, e o `--av-cabelo` daqui tem
      //    o castanho escrito ao lado justamente por isso.
      //
      // O fallback castanho é a COR MODAL de propósito, e emitir a variável sempre
      // quebraria a regressão de 19 formas / 7 468 bytes da base. O salto de cor
      // entre careca e com-cabelo é consequência aceita — a folha mostra as duas
      // colunas justamente para isso ser visto, não deduzido.
      { d: dNucleo.join(" "), cor: "var(--av-cabelo, #5A4632)", semTraco: true },
    ],
  };
}

// ---------------------------------------------------------------------------
// As réguas — e elas medem PONTOS, não o `d` emitido
// ---------------------------------------------------------------------------

/**
 * A tinta da peça, como poligonal fina — a curva que o navegador de fato pinta.
 *
 * `amostrarSpline` e não os vértices: entre dois pontos distantes a spline
 * centrípeta arqueia, e medir a corda mediria uma curva que ninguém desenha. A
 * lição está em `geometria.ts:845` — 246 u de reta com corda 0 px de erro e spline
 * 23 a 28 px.
 *
 * **É por isso que `Barba` guarda pontos e não `d: string`.** O risco 7 do plano —
 * *"path emitido não se mede"* — é dívida declarada de `Traje.extensoes`; aqui ela
 * não nasce.
 */
function tintaDaPeca(b: Barba, comBigode: boolean): Ponto[] {
  const laços = [pontosDaMassa(b), ...(comBigode && b.bigode ? [b.bigode.map(emAbsoluto)] : [])];
  return laços.flatMap((l) => amostrarSpline(l, true));
}

/** Distância de um ponto a uma caixa — 0 se estiver dentro dela. */
const ateACaixa = (
  c: { x0: number; x1: number; y0: number; y1: number },
  p: Ponto,
): number =>
  Math.hypot(
    Math.max(c.x0 - p.x, 0, p.x - c.x1),
    Math.max(c.y0 - p.y, 0, p.y - c.y1),
  );

/**
 * A FOLGA À BOCA — quanto de pele sobra entre a tinta da barba e a da boca.
 *
 * Mede contra a caixa de TINTA da boca, e desconta meio traço da peça: a fronteira
 * declarada não é onde o preto acaba. Piso: 26 u.
 */
export function folgaDaBoca(b: Barba, comBigode = true): number {
  const boca = { x0: 268.9, x1: 311.1, y0: 296.2, y1: 305.1 };
  return Math.min(...tintaDaPeca(b, comBigode).map((p) => ateACaixa(boca, p))) - MEIO;
}

/** A folga a CADA olho, separada — o `GIRO` faz os dois números diferirem. */
export function folgaDoOlho(b: Barba, comBigode = true): { esq: number; dir: number } {
  const t = tintaDaPeca(b, comBigode);
  const de = (o: (typeof OLHOS)[number]) => Math.min(...t.map((p) => ateACaixa(o, p))) - MEIO;
  return { esq: de(OLHOS[0]), dir: de(OLHOS[1]) };
}

/**
 * QUANTO A PEÇA ENTRA NA CABEÇA — a mesma amarra de `ancoragemDasExtensoes`.
 *
 * Uma barba que só encoste na silhueta lê como adesivo colado ao lado do queixo, e
 * meio pixel de antialiasing abre uma fresta de fundo entre as duas. Piso: `SANGRIA`.
 */
export function ancoragem(b: Barba): number {
  let fundo = 0;
  for (const p of amostrarSpline(pontosDaMassa(b), true)) {
    if (dentroDe(CABECA.contorno, p)) fundo = Math.max(fundo, ateAPoligonal(CABECA.contorno, p));
  }
  return fundo;
}

/** A caixa da TINTA da peça, com meio traço somado nos quatro lados. */
export function caixaDaTinta(b: Barba, comBigode = true) {
  const t = tintaDaPeca(b, comBigode);
  return {
    x0: Math.min(...t.map((p) => p.x)) - MEIO,
    x1: Math.max(...t.map((p) => p.x)) + MEIO,
    y0: Math.min(...t.map((p) => p.y)) - MEIO,
    y1: Math.max(...t.map((p) => p.y)) + MEIO,
  };
}

/**
 * A BANDA PRETA DECLARADA: `recuo + meio traço`, ponto a ponto.
 *
 * **O espalhamento é o número desta etapa.** Um `stroke` dá 12 u constantes e
 * espalhamento zero — é exatamente isso que separa a receita de duas formas cheias
 * de um contorno sintetizado, e é o IoU 80,1% × 34,4% dito em régua de espessura.
 * Meta: mínimo ≥ 8, máximo 30–34, espalhamento ≥ 22.
 */
export function bandaDeclarada(b: Barba, comBigode = true) {
  const rs = [...b.massa, ...(comBigode && b.bigode ? b.bigode : [])]
    .map((p) => p.recuo + MEIO)
    .sort((x, y) => x - y);
  return {
    min: rs[0],
    mediana: rs[Math.floor(rs.length / 2)],
    max: rs[rs.length - 1],
    espalhamento: rs[rs.length - 1] - rs[0],
  };
}

/**
 * PONTOS `{t, y}` FORA DO CONTORNO — a amarra contra a mentira calada de `bordasEm`.
 *
 * Fora da faixa do contorno ela devolve a CAIXA da cabeça, e um `t` de 0,5 vira o
 * meio de uma caixa em vez do meio de um crânio. Não é erro, não lança, não
 * aparece: a peça só sai no lugar errado. Quem precisa daquela altura escreve
 * `{x, y}`, como a crista do moicano.
 */
export function pontosForaDoContorno(b: Barba, comBigode = true): string[] {
  const ys = CABECA.contorno.map((p) => p.y);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return [...b.massa, ...(comBigode && b.bigode ? b.bigode : [])]
    .filter((p) => ehRelativo(p) && (p.y < y0 || p.y > y1))
    .map(
      (p) =>
        `ponto {t, y} em y ${p.y} está fora do contorno (${y0.toFixed(1)}–${y1.toFixed(1)}): ` +
        `\`bordasEm\` devolve a CAIXA ali, e o \`t\` passa a medir outra coisa em silêncio. ` +
        `Abaixo do queixo o ponto é {x, y}.`,
    );
}

/**
 * A BORDA CORRE PARALELA AO CRÂNIO? — a acusação da primeira crítica, virada régua.
 *
 * A folha da 1ª versão voltou com *"a forma é derivada da silhueta do crânio por
 * deslocamento constante"*, e **medido isso era falso**: o espalhamento p10–p90 da
 * distância ao contorno deu 33,9 a 46,5 u nas três. O diagnóstico não sobreviveu à
 * régua; o sintoma que ele descrevia (a peça lendo como color-block), sim.
 *
 * Ela fica aqui **impressa e não gateada** de propósito, e a `terco-inferior` é o
 * exemplo vivo: costeleta que desce pela borda do crânio tem por obrigação
 * acompanhá-la, e um piso aqui a reprovaria por definição — seria a régua projetando
 * a peça em vez de julgá-la, o erro que este projeto já pagou uma vez, com um piso de
 * 5% ditando a forma e o resultado saindo color-block.
 */
export function paralelismoAoCranio(b: Barba): { p10: number; p50: number; p90: number } {
  const ds = amostrarSpline(pontosDaMassa(b), true)
    .map((p) => ateAPoligonal(CABECA.contorno, p))
    .filter((d) => d < 60)
    .sort((x, y) => x - y);
  if (!ds.length) return { p10: NaN, p50: NaN, p90: NaN };
  const q = (f: number) => ds[Math.min(ds.length - 1, Math.floor(f * ds.length))];
  return { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
}

/**
 * ---------------------------------------------------------------------------
 * AS QUATRO RÉGUAS DA ETAPA 1b — e a primeira delas é a que faltou
 * ---------------------------------------------------------------------------
 *
 * A etapa 1 mediu cinco coisas e **todas as cinco eram distâncias às feições**:
 * folga à boca, folga aos olhos, janela, ancoragem, contenção. Nenhuma perguntou se
 * a peça **toca o rosto**. Uma peça que não encosta em nada passa em todas com folga
 * — e uma peça que não encosta no rosto é um colar. Foi o que a folha mostrou, e a
 * causa está aqui: o conjunto das amarras premiava o afastamento.
 *
 * Medido nas três reprovadas: da própria tinta, só **15,3%** (`cunha`), 46,9%
 * (`grenha`) e 98,5% (`cerrada`) caía dentro do contorno da cabeça.
 */

/**
 * QUANTO DA PEÇA ESTÁ NO ROSTO — e as duas frações respondem perguntas diferentes.
 *
 *   `dentro`    — da tinta da peça, que fração cai dentro do contorno da cabeça.
 *                 É a régua contra o colar: 15,3% é uma peça pendurada;
 *   `ocupacao`  — da área da cabeça, que fração a peça cobre. É a régua contra o
 *                 outro extremo, a peça que engole o rosto.
 *
 * **É aviso e não gate, e isso é decisão declarada.** O eixo vertical desta etapa
 * troca `dentro` por *"ligado à boca"* de propósito — a base oferece 93,9 u verticais
 * contra 42,1 u horizontais, e o espaço abaixo do queixo vale 3,2× o de dentro da
 * cabeça. Um piso aqui reprovaria o cavanhaque por definição, que é a régua
 * projetando a peça em vez de julgá-la — o erro que este repositório já pagou uma
 * vez, com um piso de 5% ditando a forma e o resultado saindo color-block.
 *
 * Grade de 2 u: a resposta muda menos de 0,5 ponto contra 1 u, e roda 4× mais rápido.
 */
export function coberturaDoRosto(
  b: Barba,
  comBigode = true,
): { dentro: number; ocupacao: number } {
  const laços = [
    amostrarSpline(pontosDaMassa(b), true),
    ...(comBigode && b.bigode ? [amostrarSpline(b.bigode.map(emAbsoluto), true)] : []),
  ];
  const todos = laços.flat();
  const PASSO = 2;
  const x0 = Math.min(...todos.map((p) => p.x));
  const x1 = Math.max(...todos.map((p) => p.x));
  const y0 = Math.min(...todos.map((p) => p.y));
  const y1 = Math.max(...todos.map((p) => p.y));

  let tinta = 0;
  let dentro = 0;
  for (let y = y0; y <= y1; y += PASSO) {
    for (let x = x0; x <= x1; x += PASSO) {
      const p = { x, y };
      if (!laços.some((l) => dentroDe(l, p))) continue;
      tinta++;
      if (dentroDe(CABECA.contorno, p)) dentro++;
    }
  }
  const areaCabeca = Math.abs(areaComSinal(CABECA.contorno));
  return {
    dentro: tinta ? dentro / tinta : 0,
    ocupacao: (dentro * PASSO * PASSO) / areaCabeca,
  };
}

/**
 * A DERIVA PARA O QUEIXO — e ela é obrigatória por causa do `GIRO`, não do gosto.
 *
 * A boca está em **x 290**; o centro do crânio na altura do queixo (y 340) está em
 * **x 264,4**. Um cavanhaque que desça reto da boca cai 25,6 u fora do queixo, e a
 * 32 px isso é a barba pendendo visivelmente do lado direito de um rosto girado.
 *
 * `desalinho` é o que o gate cobra: a tinta ABAIXO do queixo tem de estar centrada
 * a menos de **20 u** do centro do crânio ali. Vinte e não 26: uma peça rigidamente
 * alinhada à boca dá 25,6 e reprova, e uma que derivou ~6 u passa. O piso exige
 * **alguma** deriva sem ditar quanta — quem decide a forma é o desenho.
 *
 * `deriva` sai impressa ao lado, e é o número descritivo: quanto o centro da peça
 * andou para a esquerda entre a faixa do queixo e a de baixo dele.
 */
export function derivaDoQueixo(
  b: Barba,
  comBigode = true,
): {
  centroNoQueixo: number;
  centroAbaixo: number;
  deriva: number;
  cranioNoQueixo: number;
  desalinho: number;
} | null {
  const t = tintaDaPeca(b, comBigode);
  const centroEm = (a: number, c: number) => {
    const xs = t.filter((p) => p.y >= a && p.y < c).map((p) => p.x);
    return xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : NaN;
  };
  const bordas = bordasEm(340);
  const cranioNoQueixo = (bordas.esq + bordas.dir) / 2;

  const centroNoQueixo = centroEm(325, 348);
  const centroAbaixo = centroEm(352, 1e4);
  // Sem tinta abaixo do queixo não há do que pender: a peça de terço inferior vive
  // inteira dentro da cabeça, e cobrar deriva dela seria cobrar de um problema que
  // ela não tem.
  if (!Number.isFinite(centroAbaixo)) return null;
  return {
    centroNoQueixo,
    centroAbaixo,
    deriva: Number.isFinite(centroNoQueixo) ? centroNoQueixo - centroAbaixo : NaN,
    cranioNoQueixo,
    desalinho: centroAbaixo - cranioNoQueixo,
  };
}

/** O piso da deriva: a tinta abaixo do queixo, a menos disto do centro do crânio. */
export const DESALINHO_MAXIMO = 20;

/**
 * A MECHA TOCA A FRONTEIRA DO NÚCLEO? — fio de cabelo × pinta, e esta é gate.
 *
 * A crítica da primeira folha leu os furos como **pele de onça**, e a causa é
 * topológica: um furo no MEIO do núcleo é uma ilha de preto cercada de castanho, e
 * ilha de preto é pinta. Um fio de cabelo não é ilha — ele **sai da massa**, corre
 * pelo pelo e afina. A diferença entre as duas leituras é uma só: o furo encosta na
 * fronteira do núcleo ou não.
 *
 * Devolve a distância mínima de cada furo à borda do núcleo. Piso: 16 u ≈ 1 px a 32.
 */
export function mechaTocaAFronteira(b: Barba): number[] {
  if (!b.mechas?.length) return [];
  const borda = amostrarSpline(pontosDoNucleo(b), true);
  return b.mechas.map((m) =>
    Math.min(...amostrarSpline(m.map(emAbsoluto), true).map((p) => ateAPoligonal(borda, p))),
  );
}

/** Quanto um furo pode flutuar antes de virar pinta. 16 u ≈ 1 px a 32. */
export const TOQUE_DA_MECHA = 16;

/**
 * A SERRILHA DA BORDA DE BAIXO — amplitude dos dentes, e é assinatura de material.
 *
 * Tecido tem bainha; pelo tem ponta. Uma borda inferior lisa é uma spline, e spline
 * lisa lê como corte de tesoura em pano — foi metade da leitura de *"gola"* e
 * *"cachecol"* da primeira folha.
 *
 * Mede o perfil de baixo em colunas de 8 u e devolve o resíduo contra a média dos
 * dois vizinhos: uma curva lisa dá ~0 porque ela É a média dos vizinhos. `dentes`
 * conta as trocas de sinal do resíduo — dois dentes seguidos para o mesmo lado são
 * uma curva, não serrilha.
 *
 * Impressa, não gateada: a amplitude que uma direção quer é escolha da direção. A
 * `Aparado` pede borda quase lisa por definição.
 */
export function serrilhaDaBorda(b: Barba): { p50: number; max: number; dentes: number } {
  const t = amostrarSpline(pontosDaMassa(b), true);
  const x0 = Math.min(...t.map((p) => p.x));
  const x1 = Math.max(...t.map((p) => p.x));
  const n = Math.max(3, Math.round((x1 - x0) / 8));
  const largura = (x1 - x0) / n;

  const perfil: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = x0 + i * largura;
    const ys = t.filter((p) => p.x >= a && p.x < a + largura).map((p) => p.y);
    if (ys.length) perfil.push(Math.max(...ys));
  }
  if (perfil.length < 3) return { p50: 0, max: 0, dentes: 0 };

  const res: number[] = [];
  let dentes = 0;
  let sinal = 0;
  for (let k = 1; k < perfil.length - 1; k++) {
    const d = perfil[k] - (perfil[k - 1] + perfil[k + 1]) / 2;
    res.push(Math.abs(d));
    const s = Math.sign(d);
    if (s && sinal && s !== sinal) dentes++;
    if (s) sinal = s;
  }
  const ord = [...res].sort((a, c) => a - c);
  return { p50: ord[Math.floor(ord.length / 2)], max: ord[ord.length - 1], dentes };
}

/**
 * AS MECHAS SÃO DIFERENTES ENTRE SI? — a segunda acusação, e esta é gate.
 *
 * *"Os dentes da borda inferior são todos do mesmo tamanho e do mesmo passo — leem
 * como serrilha impressa."* Quatro furos idênticos são uma textura de impressora, e
 * é a versão em furo do mesmo defeito que o `DEGRAU` constante do cabelo tem:
 * regularidade lê como máquina.
 *
 * Devolve a dispersão relativa das áreas. Abaixo de 0,35 é serrilha.
 */
export function irregularidadeDasMechas(b: Barba): number | null {
  const areas = (b.mechas ?? []).map((m) => Math.abs(areaComSinal(m.map(emAbsoluto))));
  if (areas.length < 2) return null;
  const media = areas.reduce((a, v) => a + v, 0) / areas.length;
  if (!media) return 0;
  const dp = Math.sqrt(areas.reduce((a, v) => a + (v - media) ** 2, 0) / areas.length);
  return dp / media;
}

/** A tinta entra na janela da boca? Devolve o quanto, em unidades, ou 0. */
export function invasaoDaJanela(b: Barba, comBigode = true): number {
  let pior = 0;
  for (const p of tintaDaPeca(b, comBigode)) {
    const dentroX = p.x > JANELA_DA_BOCA.x0 - MEIO && p.x < JANELA_DA_BOCA.x1 + MEIO;
    const dentroY = p.y > JANELA_DA_BOCA.y0 - MEIO && p.y < JANELA_DA_BOCA.y1 + MEIO;
    if (!dentroX || !dentroY) continue;
    pior = Math.max(
      pior,
      Math.min(
        p.x - (JANELA_DA_BOCA.x0 - MEIO),
        JANELA_DA_BOCA.x1 + MEIO - p.x,
        p.y - (JANELA_DA_BOCA.y0 - MEIO),
        JANELA_DA_BOCA.y1 + MEIO - p.y,
      ),
    );
  }
  return pior;
}

/**
 * AS SONDAS DA BANDA PRETA — ponto sobre a fronteira e normal apontando para DENTRO.
 *
 * A `bandaDeclarada` acima diz o que a tabela pediu. Esta existe para a bancada
 * medir o que o navegador **pintou**, caminhando pela normal no raster de 425 px:
 * é a mesma sonda pela normal que `tracar-cabelo.ts` usa para ler a arte, virada
 * para o outro lado (do render para o número, em vez do PNG para o número).
 *
 * O sentido da normal é **verificado** com `dentroDe`, não deduzido do sinal da
 * área — pelo mesmo motivo de `pontosDoNucleo`, e porque uma sonda apontando para
 * fora mediria o fundo e devolveria banda zero sem reclamar de nada.
 */
export function sondasDaBanda(b: Barba, porArco = 4): { p: Ponto; n: Ponto }[] {
  const laçoInteiro = pontosDaMassa(b);
  const curva = amostrarSpline(laçoInteiro, true, porArco);
  const N = curva.length;

  const cru = curva.map((p, i) => {
    const a = curva[(i - 1 + N) % N];
    const c = curva[(i + 1) % N];
    const dx = c.x - a.x;
    const dy = c.y - a.y;
    const h = Math.hypot(dx, dy) || 1;
    return { p, n: { x: dy / h, y: -dx / h } };
  });

  const dentro = cru.filter((s) =>
    dentroDe(laçoInteiro, { x: s.p.x + 2 * s.n.x, y: s.p.y + 2 * s.n.y }),
  ).length;
  const s = dentro >= N / 2 ? 1 : -1;
  return cru.map(({ p, n }) => ({ p, n: { x: s * n.x, y: s * n.y } }));
}

/**
 * As amarras todas de uma vez, do jeito que a bancada imprime.
 *
 * ---------------------------------------------------------------------------
 * A JANELA É AVISO E A FOLGA É GATE — e a escolha entre as duas foi medida
 * ---------------------------------------------------------------------------
 *
 * As duas dizem a mesma coisa por caminhos diferentes, e **discordam nos cantos**:
 * a janela é um retângulo (16 u lateral, 26 u vertical), e a folga é a distância
 * euclidiana à caixa de tinta da boca. Medido na `cerrada`, o ponto (332, 336) fica
 * a **31,3 u** da boca na diagonal — folgadíssimo — e mesmo assim caía DENTRO do
 * retângulo, porque um retângulo exige 26 u na vertical até nas quinas, onde a
 * distância real já é 31.
 *
 * Se o retângulo reprovasse, ele estaria **projetando a peça** em vez de julgá-la:
 * a borda da barba teria de contornar uma quina que não corresponde a nenhum risco
 * de legibilidade. É o defeito que o repositório já pagou uma vez — um piso ditando
 * a forma e o resultado saindo color-block. A régua julga; ela não desenha.
 *
 * Então o gate é a folga euclidiana, que protege o sorriso em TODA direção, e o
 * retângulo fica impresso como referência conservadora.
 */
export function amarrasDaBarba(
  b: Barba,
  comBigode = true,
  pisos: PisosDoRosto = PISOS_DE_PRODUCAO,
): { problemas: string[]; avisos: string[] } {
  const problemas = [...pontosForaDoContorno(b, comBigode)];
  const avisos: string[] = [];

  if (pisos !== PISOS_DE_PRODUCAO) {
    avisos.push(
      `PISOS REBAIXADOS por parâmetro: boca ${pisos.boca} (produção ${PISOS_DE_PRODUCAO.boca}), ` +
        `olho ${pisos.olho} (produção ${PISOS_DE_PRODUCAO.olho}). Isto NÃO é peça aprovável — ` +
        `é a coluna que mostra o custo das travas, e ${pisos.boca} u de pele em volta da boca ` +
        `são ${(pisos.boca / 16.37).toFixed(2)} px a 32`,
    );
  }

  const boca = folgaDaBoca(b, comBigode);
  if (boca < pisos.boca) {
    problemas.push(
      `folga à boca ${boca.toFixed(1)} u contra o piso de ${pisos.boca} — a barba é desenhada ` +
        `DEPOIS da boca, e toda tinta sobre ela apaga a única expressão do boneco`,
    );
  }

  const invasao = invasaoDaJanela(b, comBigode);
  if (invasao > 0) {
    avisos.push(
      `a tinta entra ${invasao.toFixed(1)} u no RETÂNGULO da janela, mas a folga real à ` +
        `boca é ${boca.toFixed(1)} u (piso 26). O retângulo é conservador nas quinas — ` +
        `quem gateia é a folga`,
    );
  }

  const olho = folgaDoOlho(b, comBigode);
  for (const [lado, v] of [["esq", olho.esq], ["dir", olho.dir]] as const) {
    if (v < pisos.olho) {
      problemas.push(
        `folga ao olho ${lado} ${v.toFixed(1)} u contra o piso de ${pisos.olho} — ` +
          `duas marcas pretas encostam por antialiasing a 56 px`,
      );
    }
  }

  // A DERIVA, E ELA SÓ VALE PARA QUEM DESCE. Peça que vive dentro da cabeça não
  // pende de nada, e `derivaDoQueixo` devolve `null` para dizer isso.
  const dq = derivaDoQueixo(b, comBigode);
  if (dq && Math.abs(dq.desalinho) > DESALINHO_MAXIMO) {
    problemas.push(
      `a tinta abaixo do queixo está centrada em x ${dq.centroAbaixo.toFixed(1)}, ` +
        `${Math.abs(dq.desalinho).toFixed(1)} u ${dq.desalinho > 0 ? "à direita" : "à esquerda"} ` +
        `do centro do crânio ali (x ${dq.cranioNoQueixo.toFixed(1)}, máximo ${DESALINHO_MAXIMO}) — ` +
        `o \`GIRO\` põe a boca em x 290 e o queixo em x ${dq.cranioNoQueixo.toFixed(1)}, então uma ` +
        `peça que desce reto da boca pende 25,6 u fora do queixo`,
    );
  }

  // A MECHA QUE FLUTUA É PINTA. Régua nova da etapa 1b — ver `mechaTocaAFronteira`.
  for (const [i, d] of mechaTocaAFronteira(b).entries()) {
    if (d > TOQUE_DA_MECHA) {
      problemas.push(
        `a mecha ${i + 1} flutua ${d.toFixed(1)} u da fronteira do núcleo ` +
          `(máximo ${TOQUE_DA_MECHA}) — furo no meio do núcleo é ilha de preto cercada de ` +
          `castanho, e ilha de preto lê como PINTA. Fio de cabelo sai da massa`,
      );
    }
  }

  const irreg = irregularidadeDasMechas(b);
  if (irreg !== null && irreg < 0.35) {
    problemas.push(
      `as mechas têm dispersão de área de só ${(100 * irreg).toFixed(0)}% (piso 35%) — ` +
        `furos do mesmo tamanho no mesmo passo leem como serrilha impressa, que é o ` +
        `\`DEGRAU\` constante do cabelo escrito em furo`,
    );
  }

  const anc = ancoragem(b);
  if (anc < SANGRIA) {
    problemas.push(
      `a massa ancora só ${anc.toFixed(1)} u dentro da cabeça (mínimo ${SANGRIA}) — ` +
        `ela lê como adesivo colado embaixo do queixo`,
    );
  }

  // A RÉGUA QUE FALTOU, e ela é aviso pelo motivo escrito em `coberturaDoRosto`: o
  // eixo vertical troca `dentro` por "ligado à boca" de propósito.
  const cob = coberturaDoRosto(b, comBigode);
  if (cob.dentro < 0.25) {
    avisos.push(
      `só ${(100 * cob.dentro).toFixed(1)}% da tinta da peça cai dentro do contorno da ` +
        `cabeça (referência de aviso: 25%) — abaixo disso a peça é mais pendente que ` +
        `barba, e foi o que reprovou a \`cunha\` a 15,3%. Aviso e não gate: o eixo ` +
        `vertical desce de propósito, e quem julga é o olho`,
    );
  }

  return { problemas, avisos };
}

// ---------------------------------------------------------------------------
// AS DUAS REGRAS — e o que as separa é a LEI, não o desenho
// ---------------------------------------------------------------------------
//
// As três tabelas da etapa 1 (`cerrada`, `cunha`, `grenha`) saíram daqui. Elas foram
// reprovadas — *"resultado muito ruim"*, lendo como cachecol, gola e tira de couro —,
// e mantê-las no módulo de produção como "histórico" seria arte morta esperando
// alguém achar que já foi aprovada. O que elas ensinaram está escrito: o defeito era
// de EIXO, e a lição virou `coberturaDoRosto` logo acima.
//
// O que separa "pelo facial" de "tecido" não é quantidade de massa, é **eixo**: uma
// faixa horizontal sob a mandíbula é uma gola; uma massa **vertical ligada à boca**
// é barba. A base oferece 93,9 u verticais (5,73 px a 32) contra 42,1 u horizontais
// (2,57 px), e o espaço abaixo do queixo vale **3,2×** o de dentro da cabeça — 4,38
// px contra 1,35 px a 32.
//
// As duas tabelas de agora **não são duas direções de desenho**: são as duas leis
// possíveis, e é o Doug quem escolhe entre elas antes de haver direção nenhuma.
//
//   vertical        — bigode + cavanhaque, com os pisos de HOJE (boca 26 · olho 24).
//                     É a única barba que a lei atual permite;
//   terco-inferior  — a barba que lê como barba, e que só existe se os dois pisos
//                     caírem juntos (boca 6 · olho 12). Roda com `pisos` rebaixados
//                     por PARÂMETRO — os de produção não se mexem até ele decidir.
//
// Risco nomeado das duas, e ele é o mesmo da etapa 1 virado do avesso: a `vertical`
// pode ler como **pingente**, e a `terco-inferior` compra legibilidade de barba com
// 0,37 px de pele em volta do sorriso.

/**
 * O BIGODE — e ele DEIXOU DE SER OPCIONAL nesta etapa.
 *
 * Na etapa 1 ele era enfeite: uma ilha de 57 u (x 264–317, y 234–257) entre os dois
 * olhos, e a crítica renderizada leu as seis células com ele como **nariz** — o que
 * o achado **D16** registra, com a causa (o corredor) e o veredito de que não há
 * conserto por desenho.
 *
 * No eixo vertical o papel dele muda: **é ele que liga a peça à boca.** Sem o
 * bigode, o cavanhaque é uma massa solta abaixo do queixo — exatamente o que a
 * `cunha` era, com 15,3% da tinta dentro do rosto. Com ele, os dois compartilham o
 * eixo vertical e a leitura de "nariz solto" perde o "solto".
 *
 * Medido, ele passa em todos os pisos de hoje: **26,5 u** de folga ao olho esquerdo,
 * 25,5 ao direito, **39,2 u** à boca. Tinta 4,0 × 2,1 px a 32.
 *
 * Continua custando **zero forma** — sai como subpath `M…Z M…Z` das mesmas duas
 * formas —, então a aposta desta etapa é grátis no orçamento. Se a folha disser que
 * a leitura de nariz sobreviveu ao eixo, o D16 fecha por decisão.
 */
const BIGODE: readonly PontoDaMassa[] = [
  { x: 264, y: 240, recuo: 4 },
  { x: 290, y: 234, recuo: 5 },
  { x: 317, y: 241, recuo: 4 },
  { x: 312, y: 256, recuo: 4 },
  { x: 290, y: 250, recuo: 5 },
  { x: 268, y: 257, recuo: 4 },
];

export const BARBAS: Record<string, Barba> = {
  /**
   * A BARBA QUE A LEI DE HOJE PERMITE — bigode ligado a um cavanhaque que desce.
   *
   * O corredor manda: com 26 u de folga à boca, a tinta só atravessa o centro do
   * rosto **de y 340 para baixo** (medido em `.scratch/estilo/_vertical.ts`, e a
   * faixa central x 257–323 fica vetada até ali). Então o cavanhaque nasce colado ao
   * limite e o resto da peça é para baixo.
   *
   * **A asa esquerda é obrigação, não estilo, e ela é assimétrica pelo `GIRO`.**
   * `ancoragem` exige ≥ SANGRIA (10 u) de massa dentro do contorno da cabeça, e o
   * queixo acaba em y 347,2: um topo reto em y 340 ancora 7,2 u e reprova. À
   * esquerda, onde a boca está longe (x ≤ 248 é livre já em y 330), a peça sobe 10 u
   * e ancora 17. À direita ela não pode — a boca está a x 311 e o corredor fecha.
   * Assimetria medida, como no cabelo.
   *
   * **O teto de descida é y ≈ 404 e não 425.** A 425 a peça cobre x 128–372 do
   * tronco, que é onde mora a gola — o sinal de patente (achado D-gola, risco 3 do
   * plano). A 404 sobram 38,9 u abaixo da silhueta, ainda 1,8× a barra de dentro da
   * cabeça.
   *
   * **A deriva de 25,6 u.** A boca está em x 290 e o centro do crânio em y 340 está
   * em x 264,4: descer reto da boca põe a barba fora do queixo. Aqui a massa deriva
   * para a esquerda descendo, e `derivaDoQueixo` gateia o resultado.
   */
  vertical: {
    id: "rosto-barba-cavanhaque",
    nome: "Vertical",
    eixo: "bigode ligado a um cavanhaque que DESCE — massa vertical, com os pisos de hoje intactos",
    massa: [
      // A ASA ESQUERDA — ancora a peça, e a ponta afina até morrer (recuo 3).
      { x: 236, y: 331, recuo: 3 },
      // O topo, colado ao limite do corredor: abaixo de y 340 no centro do rosto.
      { x: 266, y: 341, recuo: 12 },
      { x: 290, y: 344, recuo: 16 },
      { x: 314, y: 341, recuo: 12 },
      // A ponta direita, mais curta que a esquerda porque o corredor é mais estreito
      // ali — o mesmo GIRO que faz o flanco esquerdo ter 200,8 u contra 144,2.
      { x: 334, y: 337, recuo: 3 },
      // E DESCE, derivando para a esquerda: o queixo está 25,6 u à esquerda da boca.
      { x: 324, y: 361, recuo: 14 },
      { x: 307, y: 382, recuo: 20 },
      // O ponto mais grosso da banda: 25 + meio traço = 31 u, e é ele que dá o
      // espalhamento de 22 que separa esta receita de um `stroke` de 12 constantes.
      { x: 283, y: 397, recuo: 25 },
      { x: 256, y: 404, recuo: 20 },
      { x: 234, y: 392, recuo: 15 },
      { x: 222, y: 368, recuo: 9 },
      { x: 220, y: 344, recuo: 4 },
    ],
    // AS MECHAS TOCAM A FRONTEIRA DO NÚCLEO, e é a régua nova da etapa 1b.
    //
    // Na etapa 1 elas flutuavam no meio do núcleo e a crítica leu **pele de onça**:
    // um furo cercado de castanho por todos os lados é uma ilha de preto, e ilha de
    // preto é pinta. Fio de cabelo sai da massa e corre no sentido do pelo — aqui,
    // para baixo, que é o eixo da peça. `mechaTocaAFronteira` cobra ≤ 16 u.
    //
    // As áreas são diferentes de propósito (`irregularidadeDasMechas` cobra 35% de
    // dispersão): quatro furos do mesmo tamanho são textura de impressora.
    mechas: [
      [
        { x: 256, y: 400 },
        { x: 268, y: 380 },
        { x: 274, y: 358 },
        { x: 264, y: 378 },
      ],
      [
        { x: 288, y: 392 },
        { x: 302, y: 372 },
        { x: 296, y: 388 },
      ],
      [
        { x: 232, y: 386 },
        { x: 244, y: 368 },
        { x: 240, y: 382 },
        { x: 234, y: 390 },
      ],
      [
        { x: 320, y: 356 },
        { x: 312, y: 372 },
        { x: 316, y: 358 },
      ],
    ],
    bigode: BIGODE,
  },

  /**
   * A BARBA QUE LÊ COMO BARBA — e ela só existe se as duas travas caírem.
   *
   * Esta tabela **não é peça aprovável**: ela roda com `pisos` rebaixados por
   * parâmetro (boca 26→6, olho 24→12) e existe para o Doug ver o custo das travas
   * antes de decidir se elas caem. Com 6 u, a pele em volta da boca vira **0,37 px a
   * 32** e 0,64 px a 56 — sub-pixel nos dois tamanhos do produto, e o sorriso passa
   * a depender de antialiasing.
   *
   * O que ela compra em troca: massa em volta da boca, costeletas ligadas ao maxilar
   * e um terço inferior escurecido de verdade. É a única topologia em que a peça
   * ocupa o rosto em vez de pender dele — e é por isso que a folha 1 põe as duas
   * lado a lado em vez de descrever a diferença em prosa.
   *
   * A boca continua **não podendo ser furo**, e isso já está fechado com número: nem
   * com folga ZERO ao olho sobram mais de 3,2 u (0,20 px) de ponte acima dela.
   * Verificado por dois caminhos independentes — corredor e furo.
   */
  "terco-inferior": {
    id: "rosto-barba-terco-inferior",
    nome: "Terço inferior",
    eixo: "massa em VOLTA da boca, costeletas ligadas ao maxilar — só existe com as travas cortadas (boca 6 · olho 12)",
    massa: [
      // A costeleta esquerda, afinando até morrer no alto.
      { x: 104, y: 244, recuo: 2 },
      // Descendo pela borda do crânio por DENTRO — `t` varia, não fica preso na borda.
      { t: 0.02, y: 272, recuo: 8 },
      { t: 0.03, y: 300, recuo: 14 },
      { t: 0.04, y: 326, recuo: 18 },
      // O maxilar, passando pouco abaixo do queixo: a peça ocupa o rosto, não pende.
      { x: 150, y: 348, recuo: 16 },
      { x: 210, y: 366, recuo: 20 },
      { x: 274, y: 372, recuo: 22 },
      { x: 336, y: 360, recuo: 20 },
      { x: 392, y: 340, recuo: 14 },
      { t: 0.97, y: 318, recuo: 12 },
      { t: 0.98, y: 292, recuo: 7 },
      // A costeleta direita, mais curta — é o que o GIRO deixa daquele lado.
      { x: 432, y: 254, recuo: 2 },
      // A FRONTEIRA DE DENTRO, voltando da direita para a esquerda. Cada ponto está
      // no limite do que os pisos REBAIXADOS deixam livre: 12 u à boca (6 + meio
      // traço) e 18 u a cada olho (12 + meio traço). É aqui que a lei aparece como
      // desenho — o corredor de hoje não permitiria nenhum destes.
      { x: 420, y: 272, recuo: 3 },
      { x: 408, y: 296, recuo: 5 },
      { x: 372, y: 302, recuo: 8 },
      { x: 332, y: 300, recuo: 8 },
      { x: 324, y: 318, recuo: 7 },
      { x: 290, y: 321, recuo: 7 },
      { x: 256, y: 318, recuo: 7 },
      { x: 248, y: 300, recuo: 8 },
      { x: 206, y: 304, recuo: 10 },
      { x: 166, y: 296, recuo: 11 },
      { x: 126, y: 268, recuo: 4 },
    ],
    mechas: [
      [
        { x: 148, y: 344 },
        { x: 166, y: 322 },
        { x: 158, y: 344 },
        { x: 146, y: 350 },
      ],
      [
        { x: 232, y: 362 },
        { x: 240, y: 336 },
        { x: 246, y: 360 },
      ],
      [
        { x: 300, y: 368 },
        { x: 306, y: 340 },
        { x: 314, y: 352 },
        { x: 308, y: 366 },
      ],
      [
        { x: 370, y: 348 },
        { x: 380, y: 328 },
        { x: 376, y: 346 },
      ],
    ],
    bigode: BIGODE,
  },
};

/** Quanto a peça pode descer: a base do `RECORTE_CABECA` em unidades internas. */
export const TETO_DURO_Y = 442.9;
/** O piso de projeto, com folga sobre o teto duro. */
export const PISO_DE_PROJETO_Y = 425;
