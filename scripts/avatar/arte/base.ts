/**
 * A BASE OFICIAL DE EDIÇÃO — o contrato entre o Gemini e o `viewBox`.
 *
 * Este módulo é a fonte única de três coisas que todo o resto da rota lê:
 *
 *  1. **o canvas** em que a arte nasce e volta;
 *  2. **a transformação pixel ↔ `viewBox`**, que aqui é FIXA e exata — e é o
 *     ganho inteiro da rota;
 *  3. **as regiões**: o que a peça pode ocupar e o que ela não pode tocar.
 *
 * ---------------------------------------------------------------------------
 * POR QUE A TRANSFORMAÇÃO PODE SER FIXA (e por que isso é o ponto)
 * ---------------------------------------------------------------------------
 *
 * No pipeline vigente a arte vem de um gerador que desenha **outra cabeça**, e
 * por isso `importar-peca.ts` precisa redescobrir onde ela está: acha os olhos
 * por razão de aspecto (`fonte-svg.ts:782`), acha a guia do crânio por contenção
 * de caixas (`semantizar.ts:157`), e registra uma cabeça contra a outra por
 * marcos (`importar-peca.ts:462`). Isso não é excesso de zelo — é a única saída
 * quando as duas cabeças não são a mesma.
 *
 * E não fecha. A `ficha.md` da `curto-espetada` mede o resíduo: a cabeça do
 * gerador é mais estreita que o crânio kokeshi na cúpula (163 u contra 246 em
 * y 58), a anisotropia do registro é **cega** para isso (0,56%), e a coroa
 * cobria 8,3% onde se exige 100. Nenhuma régua conserta duas formas diferentes.
 *
 * Aqui a arte é editada **sobre um render do próprio compositor**. A cabeça da
 * arte é a cabeça do produto, byte a byte, porque saiu dela. Então a conversão
 * de pixel para unidade é uma conta de duas linhas, e a redescoberta inteira
 * deixa de ter o que descobrir.
 *
 * ---------------------------------------------------------------------------
 * OS NÚMEROS DO CANVAS, E POR QUE CADA UM É ESTE
 * ---------------------------------------------------------------------------
 *
 * **1024 × 1024, quadrado.** Não é o 5:7 do `viewBox`, de propósito. O destino
 * do arquivo é o Gemini, e ele devolve o que quer: a pesquisa de 2026-08-05 não
 * achou garantia documentada de que a saída herda a dimensão da entrada, e no app
 * há reclamação aberta de que o tamanho pedido é ignorado. Quadrado 1024 é o
 * formato nativo dele e é o que a `referencia.png` deste repositório já é
 * (`gerar.ts`, `LADO_REFERENCIA = 1024`). Entregar 5:7 seria pedir para a arte
 * voltar reenquadrada — e reenquadrada o Gate −1 reprova, corretamente, uma arte
 * que só errou por causa da nossa escolha de canvas.
 *
 * **Escala 1,2 pixel por unidade, origem em (212, 92).** Os três são inteiros de
 * propósito: `x_u = (x_px − 212) / 1,2` é exata em binário para todo pixel, e
 * uma conversão exata é uma fonte a menos de desvio no fim da cadeia. A figura
 * fica com 600 × 840 px dentro dos 1024, o que deixa **92 px de folga acima do
 * `viewBox`** — 76,7 unidades — para o cabelo subir sem esbarrar na borda do
 * arquivo. Somadas às 45,5 u que existem entre o topo do `viewBox` e a coroa, são
 * ~122 u de espaço para ponta.
 *
 * Isso é folga de ARQUIVO, não de produto: o `viewBox` continua guilhotinando o
 * que passa de y = 0 (doc 14, T1.5 — 39 u acima da cabeça, 3,1 px a 56). A folga
 * existe para a ponta **chegar medida** até aqui e a folha poder mostrar que ela
 * não cabe, em vez de ela sumir no PNG e ninguém saber que existiu.
 *
 * ---------------------------------------------------------------------------
 * AS REGIÕES — e por que a permitida NÃO é o interior do crânio
 * ---------------------------------------------------------------------------
 *
 * O pedido é explícito: *"a cabeça não deve funcionar como tesoura"*. E a rodada
 * anterior mediu o preço de tratá-la como tesoura — 0 pontas externas no render,
 * silhuetas idênticas pixel a pixel entre a peça nova e a aprovada.
 *
 * Então a permitida é definida por SUBTRAÇÃO: é tudo que não é rosto nem corpo.
 * O cabelo pode ocupar o crânio, o ar acima dele e o ar dos lados. O que ele não
 * pode é mexer no rosto ou no tronco — e é isso, e só isso, que o Gate −1 mede
 * como violação.
 */

import { createHash } from "crypto";

import {
  BOCA,
  CAIXA_CABECA,
  CAIXA_DA_ARTE,
  CENTRO_X,
  EIXO_ROSTO,
  OLHO,
  OLHO_CX_DIR,
  OLHO_CX_ESQ,
  OLHO_CY_DIR,
  OLHO_CY_ESQ,
  SOBRANCELHA,
  TRACO,
  TRONCO,
  VIEWBOX,
} from "../../../src/lib/avatar/estilo/geometria";

// ---------------------------------------------------------------------------
// O canvas
// ---------------------------------------------------------------------------

/** Lado do PNG que sai daqui e volta do Gemini. Ver o topo. */
export const LADO = 1024;

/** Pixels por unidade do `viewBox`. Inteiro em binário: 1,2 = 6/5. */
export const ESCALA = 1.2;

/** Onde o canto (0,0) do `viewBox` cai no PNG. */
export const ORIGEM = { x: 212, y: 92 } as const;

/** O fundo. O mesmo `#FBF8F5` que `verificar-pose.ts` já usa para render. */
export const FUNDO = "#FBF8F5";

/**
 * O CIANO INSTRUMENTAL DA ROTA — a cor em que a massa da peça é desenhada.
 *
 * É o `#00C8C8` que `PEDIDO-GEMINI.md:43` pede ao gerador para a *massa
 * principal*, e mora aqui porque deixou de ser só instrução: quem quiser
 * **medir um render pela mesma régua que mede a arte** tem de pintar o cabelo do
 * render nesta cor. Com a cor real do produto (`CABELO[1] = #6E4326`, luminância
 * 76,5) a massa inteira cairia abaixo do corte de escuro e seria classificada
 * como TRAÇO — o erro que `coroa.ts` já cometeu e que esta rota registrou como
 * *"limiar calibrado na arte não vale no render"*.
 *
 * Não é `CABELO_TEAL` de `tracar-cabelo.ts`: aquele é o teal do pipeline antigo,
 * e a rota não depende dele. Este é o teal que a rota **pediu**, e é contra ele
 * que a arte de verdade foi desenhada.
 *
 * Ele e o tom escurecido que o compositor deriva têm de passar em `ehTeal`
 * (`extrair.ts`) — quem usa confere, e a folha de revisão confere ao começar.
 */
export const CIANO_INSTRUMENTAL = "#00C8C8";

/** Unidade → pixel. */
export const paraPx = (x: number, y: number) => ({
  x: ORIGEM.x + x * ESCALA,
  y: ORIGEM.y + y * ESCALA,
});

/** Pixel → unidade. É a conversão que a rota inteira depende de ser exata. */
export const paraUnidade = (x: number, y: number) => ({
  x: (x - ORIGEM.x) / ESCALA,
  y: (y - ORIGEM.y) / ESCALA,
});

// ---------------------------------------------------------------------------
// As regiões, em unidades do `viewBox`
// ---------------------------------------------------------------------------

export interface Caixa {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Meio traço de folga em toda fronteira de região.
 *
 * O contorno tem 12 unidades e é desenhado CENTRADO na fronteira, então metade
 * dele mora de cada lado. Sem esta folga, o antialiasing do próprio traço do
 * queixo cairia dentro do corpo protegido e toda arte reprovaria por existir.
 */
const FOLGA = TRACO / 2;

/**
 * A folga da BOCA, e ela é menor que a das outras feições de propósito.
 *
 * Cada feição merece a folga do traço COM QUE ELA É DESENHADA. Os olhos e o contorno
 * saem no traço do boneco (12 u), então `FOLGA = TRACO / 2` é a régua deles. O
 * sorriso sai com 5,3 u (`kk-risco`, `BOCA.espessura`), e herdar os 6 u do boneco
 * fazia a caixa dele proteger mais ar do que tinta.
 *
 * ⚠️ **A troca não afrouxa nada que estivesse apertado.** Medido nas três barbas
 * aprovadas: a `cavanhaque` mede 0 px dentro da caixa da boca nas duas réguas, a
 * `cheia` mede 9 nas duas, e só o `bigode` — a peça que mora acima da boca por
 * definição — cai de **167 px para 45 px**.
 *
 * **E o que a boca perde de fato está medido, não estimado:** com a peça inteira por
 * cima, sem recorte nenhum, o `barba-bigode` cobre **20 px = 6,2%** do traço do
 * sorriso, contra **1 px = 0,3%** da `barba-cheia`, que está no catálogo desde
 * 2026-08-19. Encostar na boca é o que bigode faz; o que não pode é apagá-la.
 */
const FOLGA_DA_BOCA = BOCA.espessura / 2;

/**
 * O ROSTO PROTEGIDO: os olhos e a boca, com folga de meio traço.
 *
 * A sobrancelha fica **de fora** — e é decisão, não descuido. Franja sobre a
 * sobrancelha é `achado` declarado no pipeline vigente (`gates.md`, "reprovação
 * × achado"), porque é o que penteado com franja faz. Proteger a sobrancelha
 * reprovaria toda franja legítima; proteger o olho reprova o que de fato
 * estraga o boneco, que é cabelo cobrindo o olhar.
 */
export const ROSTO: Caixa = {
  x0: OLHO_CX_ESQ - OLHO.w / 2 - FOLGA,
  y0: OLHO.cy - OLHO.h / 2 - FOLGA,
  x1: OLHO_CX_DIR + OLHO.w / 2 + FOLGA,
  y1: OLHO.cy + BOCA.abaixoDoOlho + BOCA.espessura / 2 + FOLGA,
};

/**
 * AS FEIÇÕES PROTEGIDAS — os dois olhos, cada um pela PRÓPRIA FORMA.
 *
 * ---------------------------------------------------------------------------
 * UMA CAIXA SÓ NUNCA SERVIU, E CAIXA NENHUMA SERVE
 * ---------------------------------------------------------------------------
 *
 * O conjunto a proteger — dois olhos e uma boca — **não é convexo**: a boca fica
 * embaixo e no meio, os olhos em cima e nas pontas, e os quatro cantos da caixa que
 * os envolve estão vazios. Para o CABELO isso nunca importou, porque cabelo não desce
 * até ali. Para a BARBA importa, e custou dois defeitos em dois dias:
 *
 *  - a `barba-cheia` entrava no canto inferior VAZIO do `ROSTO` — 84 px abaixo do
 *    olho direito, 67 u à direita da boca — e o recorte passava pelo MIOLO dela,
 *    deixando 27 px de aresta nua. O Doug viu a olho antes de qualquer régua;
 *  - o `barba-bigode` caía com 167 px na caixa da BOCA, que era **80% ar**.
 *
 * A boca saiu em 2026-08-20 e virou `naEspinhaDaBoca`. Os olhos saíram no mesmo dia,
 * e viram esta função. **As duas trocas são a mesma ideia:** proteger a FEIÇÃO, não
 * o retângulo em volta dela.
 *
 * ---------------------------------------------------------------------------
 * POR QUE O OLHO NÃO MERECE FOLGA DE MEIO TRAÇO
 * ---------------------------------------------------------------------------
 *
 * As caixas antigas carregavam `FOLGA = TRACO / 2` = 6 u, que é meio traço do
 * BONECO. Só que o olho não é desenhado com o traço do boneco: `compositor.ts:725`
 * emite um `<rect class="kk-tinta kk-olho" rx>` — **fill puro, sem stroke nenhum**.
 * Não há antialiasing de 6 u para acomodar, porque não há linha.
 *
 * Medido em 2026-08-20 (`.scratch/estilo/folha-regioes.ts`), em quanto de cada
 * candidata a região realmente protege TINTA do rosto:
 *
 *   opção                                área      é feição   o resto
 *   A  retângulo + 6 u (era)          9 658 u²        59%      41% AR
 *   B  cápsula   + 6 u                8 492 u²        67%
 *   C  cápsula   + 2,6 u              6 765 u²        84%
 *   D  cápsula   + 0,8 u (é)          5 994 u²        95%
 *
 * **O Doug escolheu a D**, e a margem é a mesma constante que a espinha da boca já
 * usa: `MARGEM_DO_RASTER`, 1 px do canvas de 1024². Sai do raster, não das peças —
 * é a lição do **G28**, aplicada pela terceira vez.
 *
 * ⚠️ **A troca não destrava nada HOJE, e isso está medido:** das oito artes de barba
 * que existem, só o `bigode-puro` encosta no olho, em qualquer das quatro opções
 * (111 px na A, 12 px na D). As outras sete medem **zero** nas quatro. Ela destrava o
 * PRÓXIMO bigode — qualquer peça que suba até a altura do lábio superior batia numa
 * folga que era 41% ar.
 *
 * **`ROSTO` fica como está, e é de propósito.** Ele é o que o Gate −1 e a extração de
 * cabelo medem desde sempre; trocá-lo moveria as peças já promovidas e o próprio
 * gate. Quem precisa da régua fina é a peça de rosto.
 */
export const OLHOS_PROTEGIDOS = [
  { cx: OLHO_CX_ESQ, cy: OLHO_CY_ESQ },
  { cx: OLHO_CX_DIR, cy: OLHO_CY_DIR },
] as const;

/**
 * O ponto (em unidades do `viewBox`) cai sobre a cápsula de um dos olhos?
 *
 * A mesma forma que `compositor.ts:725` emite — `<rect rx>` com `OLHO.w × OLHO.h` e
 * raio `OLHO.r` —, mais `MARGEM_DO_RASTER`, e centrada no `cy` DE CADA OLHO. As
 * caixas antigas usavam `OLHO.cy` para os dois e perdiam o desnível de 3 u do giro.
 */
export const naCapsulaDoOlho = (ux: number, uy: number): boolean => {
  const rx = OLHO.w / 2 + MARGEM_DO_RASTER;
  const ry = OLHO.h / 2 + MARGEM_DO_RASTER;
  const r = OLHO.r + MARGEM_DO_RASTER;
  for (const { cx, cy } of OLHOS_PROTEGIDOS) {
    const dx = Math.abs(ux - cx);
    const dy = Math.abs(uy - cy);
    if (dx > rx || dy > ry) continue;
    if (dx <= rx - r || dy <= ry - r) return true;
    if (Math.hypot(dx - (rx - r), dy - (ry - r)) <= r) return true;
  }
  return false;
};

/**
 * A ESPINHA DO SORRISO — e por que a boca saiu de `FEICOES` para virar isto.
 *
 * ---------------------------------------------------------------------------
 * UMA CAIXA EM VOLTA DE UM ARCO FINO PROTEGE QUASE SÓ AR
 * ---------------------------------------------------------------------------
 *
 * A boca era a terceira caixa de `FEICOES`: um retângulo de 37 × 9 u em torno de um
 * arco de 5,3 u de espessura. O `barba-bigode` — a peça que mora acima da boca por
 * definição — caía com **221 px** dentro das feições, o recorte passava pelo MIOLO
 * dela e deixava **27 px de aresta nua**: massa terminando sem o contorno preto que
 * o gerador pintou. A esteira recusava a peça, com razão.
 *
 * Encolher a folga de `TRACO / 2` (6 u, o traço do BONECO) para `BOCA.espessura / 2`
 * (2,65 u, o traço do SORRISO) levou a aresta nua de 27 px a **1 px** — quase tudo,
 * e ainda não era zero.
 *
 * ---------------------------------------------------------------------------
 * O QUE A MEDIÇÃO MOSTROU, E ELA MUDA A FORMA DA RÉGUA
 * ---------------------------------------------------------------------------
 *
 * Amostrado o arco em 400 pontos, nas três barbas aprovadas (2026-08-20,
 * `.scratch/estilo/corrida-no-sorriso.ts`): **0/400 cobertas**, nas três. O bigode
 * raspa a BORDA do traço e não encosta na linha do sorriso em ponto nenhum.
 *
 * E o que ele cobre do traço inteiro é **20 px = 6,2%**, contra **1 px = 0,3%** da
 * `barba-cheia`, que está no catálogo desde 2026-08-19. Encostar na boca é o que
 * bigode faz; o que não pode é apagá-la.
 *
 * Para escala: o traço da boca mede **0,60 px a 56** e **0,35 px a 32** — ele é
 * sub-pixel em todo tamanho que o produto serve. Uma caixa que reprova uma peça por
 * causa dele está protegendo o que ninguém vê.
 *
 * ---------------------------------------------------------------------------
 * ENTÃO A RÉGUA VIRA A ESPINHA, NÃO A CAIXA
 * ---------------------------------------------------------------------------
 *
 * O que precisa sobreviver é a LINHA do sorriso, não a banda em volta dela. Este
 * predicado protege uma faixa de ±`MEIA_ESPINHA` em torno do arco — e a largura sai
 * do RASTER, não das peças: 1 px do canvas de 1024² é 1 ÷ 1,2 = 0,83 u. É a lição do
 * **G28**, aplicada de novo.
 *
 * Custo medido da troca: **zero** para as três barbas aprovadas, porque nenhuma delas
 * toca a espinha. Quem quiser pintar POR CIMA do sorriso continua reprovando.
 */
export const MARGEM_DO_RASTER = 1 / ESCALA;

/** Alias histórico: a espinha da boca usa a mesma margem que a cápsula do olho. */
export const MEIA_ESPINHA = MARGEM_DO_RASTER;

/** O arco do sorriso, amostrado — mesmo desenho de `pathBoca()`, medido em vez de emitido. */
const ESPINHA: readonly { x: number; y: number }[] = Array.from({ length: 201 }, (_, k) => {
  const t = k / 200;
  return {
    x: EIXO_ROSTO - BOCA.larg / 2 + BOCA.larg * t,
    y: OLHO.cy + BOCA.abaixoDoOlho + BOCA.sagita * 4 * t * (1 - t),
  };
});

/** O ponto (em unidades do `viewBox`) cai sobre a linha do sorriso? */
export const naEspinhaDaBoca = (ux: number, uy: number): boolean => {
  for (const p of ESPINHA)
    if (Math.abs(p.x - ux) <= MEIA_ESPINHA && Math.abs(p.y - uy) <= MEIA_ESPINHA) return true;
  return false;
};

/**
 * A FAIXA DA SOBRANCELHA — medida e RELATADA, nunca reprovando.
 *
 * As duas coisas que podem acontecer aqui são opostas e o Gate −1 não consegue
 * distingui-las, porque nesse momento ainda não se sabe quais pixels são a peça:
 *
 *  - **franja cobrindo a sobrancelha** é legítimo, é o que penteado com franja
 *    faz, e o pipeline vigente já classifica isso como `achado` e não reprovação
 *    (`gates.md`, "reprovação × achado");
 *  - **o Gemini ter apagado ou remexido a sobrancelha** é defeito.
 *
 * Reprovar a faixa mataria a primeira; ignorá-la deixaria a segunda passar em
 * silêncio. Então ela sai como número no laudo e como painel na folha, e quem
 * decide é o olho — que é exatamente onde este projeto já pôs esse tipo de
 * julgamento.
 */
export const SOBRANCELHAS: Caixa = {
  x0: OLHO_CX_ESQ - SOBRANCELHA.larg / 2 - FOLGA,
  y0: OLHO.cy - SOBRANCELHA.acimaDoOlho - SOBRANCELHA.espessura / 2 - FOLGA,
  x1: OLHO_CX_DIR + SOBRANCELHA.larg / 2 + FOLGA,
  y1: OLHO.cy - SOBRANCELHA.acimaDoOlho + SOBRANCELHA.espessura / 2 + FOLGA,
};

/**
 * O CORPO PROTEGIDO: a SILHUETA do tronco abaixo do queixo — não uma faixa.
 *
 * A primeira versão deste módulo protegia a largura inteira do canvas abaixo do
 * queixo, e a conferência visual da base pegou o que isso custava: **toda peça
 * que desce abaixo do queixo reprovaria por construção** — trança, cortina, rabo,
 * cacheado comprido. Dois dos cinco modelos do catálogo de hoje fazem isso.
 *
 * O que se quer proteger é o tronco, e o tronco tem largura conhecida a cada
 * altura: `TRONCO.perfil` é a tabela medida da meia-largura. Ao lado dele há
 * fundo, e fundo é onde cabelo comprido legitimamente cai.
 *
 * Abaixo do fim do perfil a proteção volta a ser de borda a borda: ali mora a
 * sombra do chão, que se estende bem além do tronco, e nenhum cabelo desce até
 * lá.
 */
const meioDoTroncoEm = (y: number): number => {
  const p = TRONCO.perfil;
  if (y <= p[0].y) return p[0].meio;
  for (let i = 1; i < p.length; i++) {
    if (y <= p[i].y) {
      const t = (y - p[i - 1].y) / (p[i].y - p[i - 1].y);
      return p[i - 1].meio + t * (p[i].meio - p[i - 1].meio);
    }
  }
  return p[p.length - 1].meio;
};

/** Onde o queixo deixa de proteger e o tronco passa a proteger. */
export const Y_QUEIXO = CAIXA_CABECA.y1 + FOLGA;

/**
 * Onde a tabela do perfil PARA DE DESCREVER a silhueta — e é o penúltimo ponto,
 * não o último.
 *
 * A conferência visual da base mediu 60 pixels de roupa fora da proteção, nos
 * dois cantos de baixo, entre as linhas 827 e 831 do canvas. A causa é o
 * `ryArremate`: abaixo do último ponto medido (y 615,3, meia-largura 108,8) o path
 * fecha por um arco largo e baixo que **excede** essa meia-largura antes de
 * colapsar. Ali a tabela descreve a linha de centro de uma altura que o desenho já
 * deixou para trás.
 *
 * Cortar no penúltimo ponto (y 603,0) faz a faixa de largura total começar antes
 * do arco, e o arco inteiro passa a ser protegido pela faixa. O que se perde é
 * espaço para cabelo entre 603 e 615 unidades — 12 unidades no fundo do tronco,
 * onde nenhuma peça deste catálogo chega.
 */
export const Y_FIM_TRONCO = TRONCO.perfil[TRONCO.perfil.length - 2].y;

export function noCorpo(x: number, y: number): boolean {
  if (y <= Y_QUEIXO) return false;
  if (y > Y_FIM_TRONCO) return true;
  return Math.abs(x - CENTRO_X) <= meioDoTroncoEm(y) + FOLGA;
}

// ---------------------------------------------------------------------------
// O CAMPO DO TRAJE — onde uma peça de roupa pode legitimamente existir
// ---------------------------------------------------------------------------
//
// Ele nasceu em 2026-08-13, com a esteira de CORES FINAIS. Até então a peça era
// reconhecida pela cor: o pedido mandava pintar tudo em ciano, e nada mais na
// imagem morava naquele matiz. Com a paleta permissiva a arte chega na cor que o
// aluno vai ver, e a cor deixa de ser instrumento de medição.
//
// O que substitui o ciano é a **diferença contra a base** — mas diferença sozinha
// levaria junto tudo que o gerador re-sintetizou: as feições repintadas, o ruído
// de reencode, a sombra do chão que ele resolveu redesenhar. É o que o docstring de
// `extrair.ts` já dizia da diferença: *"ótima para PERGUNTAR se o boneco continua o
// mesmo, e ruim para responder quais pixels são a peça"*.
//
// **O campo é o que a torna boa para a segunda pergunta.** Restringir a diferença à
// região em que uma roupa PODE estar recupera a precisão que a cor dava, e a
// fronteira não é escolhida: ela sai dos tetos que o `PEDIDO-TRAJE.md` já publica e
// que o doc 21 §6.1 mediu.

/**
 * Quanto a roupa pode passar da silhueta do tronco, de cada lado: **26 unidades**.
 *
 * É metade do transbordo da cabeça na cintura (51,9 u) — a cabeça é a parte mais
 * larga do boneco, e é isso que faz ele ser este boneco. Passar disso não deixa a
 * roupa mais legível: apaga o kokeshi. Medido no doc 21 §6.1.
 */
export const TRANSBORDO_LATERAL = 26;

/**
 * Até onde a barra pode descer, em unidades abaixo da silhueta externa do tronco:
 * **18**.
 *
 * A silhueta externa fecha em `TRONCO.yBase + TRACO/2` = 640 u, e a sombra do chão
 * termina em 658. São as mesmas 18 u que o pedido publica como "21 px" no canvas de
 * 1024. Abaixo disso não há roupa — há a sombra do chão, e o que muda ali é o
 * gerador mexendo no que não devia.
 */
export const TRANSBORDO_BARRA = 18;

/**
 * A peça de traje pode existir aqui, e em nenhum outro lugar.
 *
 * Três fronteiras, e as três são teto publicado, não escolha:
 *
 *  - **em cima, o queixo.** `extensoes(traje, false)` é a última camada do SVG
 *    (`compositor.ts:971`), depois do rosto e do cabelo: uma gola que subisse
 *    acima do queixo cobriria a boca da criança. O pedido diz "nem um pixel acima".
 *  - **dos lados**, a meia-largura do tronco mais `TRANSBORDO_LATERAL`;
 *  - **embaixo**, a base da silhueta mais `TRANSBORDO_BARRA`.
 *
 * O que fica de fora não é perda silenciosa: `extrairTraje` conta os pixels
 * candidatos que caíram fora e os imprime, porque descarte em silêncio é o modo de
 * falha que esta rota inteira existe para fechar.
 */
export function noCampoDoTraje(x: number, y: number): boolean {
  if (y <= Y_QUEIXO) return false;
  if (y > TRONCO.yBase + TRACO / 2 + TRANSBORDO_BARRA) return false;
  return Math.abs(x - CENTRO_X) <= meioDoTroncoEm(y) + FOLGA + TRANSBORDO_LATERAL;
}

/**
 * O PISO DO CHAPÉU: o topo do olho mais alto, com meio traço de folga.
 *
 * ---------------------------------------------------------------------------
 * ELE ERA A SOBRANCELHA, E O DOUG O DESCEU EM 2026-08-25
 * ---------------------------------------------------------------------------
 *
 * A primeira versão parava na **sobrancelha** (y 157,7), apoiada no doc 23 §2.2:
 * *"chapéu que transborda para baixo come a testa e as sobrancelhas."* A régua
 * nasceu obedecendo essa frase e reprovou a primeira toca que a atravessou.
 *
 * O Doug, olhando a arte: *"se isso aprovar: avatar base 100% igual, contorno em
 * azul, arte chapéu não cobre os olhos."* **A regra do produto é o OLHO**, e a
 * distância entre as duas leituras é grande: são **32,8 unidades** de testa que o
 * piso velho recusava sem que nada no produto pedisse.
 *
 * O preço de manter o piso na sobrancelha estava medido na `chapeu-toca-de-cozinha`:
 * **5 817 px — 7,0% do desenho — cortados numa reta horizontal** que atravessava a
 * cabeça inteira (u x 42→448). E a mesma arte, medida contra a regra do olho, tem
 * **ZERO pixel** sobre a faixa dos olhos: sobre o rosto ela para em y 170, e o que
 * desce mais é um elemento lateral em x 66→106, fora da cara.
 *
 * ---------------------------------------------------------------------------
 * A CONSTRUÇÃO É A MESMA, SÓ O MARCO MUDOU
 * ---------------------------------------------------------------------------
 *
 * Continua sendo *"o marco mais alto, menos meio traço"*, e o meio traço continua
 * existindo pelo mesmo motivo: a linha do chapéu tem espessura, e um piso cravado
 * no topo do olho deixaria o traço dela encostar na cápsula.
 *
 * Os dois olhos não estão na mesma altura (o giro: `GIRO.desnivelOlhos`), então o
 * piso é o MAIS ALTO dos dois. Piso na média deixaria a peça comer um e não o
 * outro, que é assimetria que ninguém desenhou.
 *
 * ⚠️ **Isto NÃO é a região que a extração zera.** `ROSTO` começa no olho
 * (`ROSTO.y0 = OLHO.cy − OLHO.h/2 − FOLGA`), então uma aba apoiada na testa
 * sobrevive à extração. O piso aqui é lei de DESENHO, não de máquina: ele existe
 * para o descarte sair contado no relatório em vez de a peça chegar comendo a
 * feição — e para o Doug ver a linha antes da caneta (`base-chapeu.ts`).
 */
export const Y_PISO_DO_CHAPEU = Math.min(OLHO_CY_ESQ, OLHO_CY_DIR) - OLHO.h / 2 - TRACO / 2;

/**
 * A CAIXA DAS FEIÇÕES — o que o chapéu não pode invadir, e é uma CAIXA, não uma reta.
 *
 * ---------------------------------------------------------------------------
 * O PISO ERA UMA RETA ATRAVESSANDO A FIGURA INTEIRA, E ISSO CORTAVA O QUE NÃO
 * PROTEGIA
 * ---------------------------------------------------------------------------
 *
 * `Y_PISO_DO_CHAPEU` existe para uma coisa só: **o chapéu não come os olhos.** Até
 * 2026-08-25 ele valia para todo `x` de 0 a 500 — e os olhos ocupam **x 181 → 386**,
 * que é 41% da largura. Nos outros 59% o piso não protegia nada e cortava tudo.
 *
 * O Doug, olhando os candidatos no render: *"a proteção dos olhos está afetando a
 * lateral do rosto, chapéus que descem pelas laterais são cortados por causa da
 * proteção dos olhos."* Ele está literalmente certo, e o defeito é de forma: uma
 * feição é uma REGIÃO, e o campo a tratava como uma altura.
 *
 * Medido nos oito candidatos de 2026-08-25: **os oito perderam desenho no piso** —
 * de 1,1% a 17,8% —, e nenhum deles chegou perto do teto. O corte que reprovava não
 * era altura, era aba de lado.
 *
 * ---------------------------------------------------------------------------
 * A CAIXA, E POR QUE ELA BASTA
 * ---------------------------------------------------------------------------
 *
 * `x 181 → 386` sai dos dois olhos com meio traço de folga de cada lado, e a BOCA
 * mora dentro dela (largura 37 u, centrada) — as três feições que um chapéu poderia
 * comer estão na mesma coluna central. Fora dela há bochecha e fundo, e aba de
 * chapéu por cima de bochecha é o que aba de chapéu faz.
 *
 * Fora da caixa o piso é a **base da cabeça**: abaixo dela começa pescoço e ombro, e
 * "não encosta no ombro" continua sendo regra do pedido.
 */
export const CAIXA_DAS_FEICOES = {
  x0: OLHO_CX_ESQ - OLHO.w / 2 - TRACO / 2,
  x1: OLHO_CX_DIR + OLHO.w / 2 + TRACO / 2,
  y0: Y_PISO_DO_CHAPEU,
} as const;

/**
 * ONDE UM CHAPÉU PODE LEGITIMAMENTE EXISTIR — o campo do segundo slot de `<image>`.
 *
 * Quatro fronteiras, e as quatro são teto publicado:
 *
 *  - **em cima, a `CAIXA_DA_ARTE`.** Não é o `viewBox`: a caixa sobe a −75 desde
 *    2026-08-24, e é ela que dá ao chapéu 114 unidades acima da coroa em vez das
 *    39,5 que o retângulo velho dava;
 *  - **dos lados, a `CAIXA_DA_ARTE` de novo.** Ela foi de `x 0 → 500` para
 *    **`−20 → 520`** em 2026-08-25: o quadro do produto mostra de interno −21,7 a
 *    521,7 (é `naTela`, com `ESCALA_PADRAO`), e o campo desperdiçava 21,7 u de cada
 *    lado. Os −20 são o maior valor que cai em **pixel inteiro** do canvas (188 e
 *    836), que é o mesmo critério que escolheu o −75 do teto;
 *  - **embaixo e no meio, a `CAIXA_DAS_FEICOES`** — o piso do olho, mas só na
 *    coluna em que há olho;
 *  - **embaixo e nas laterais, a base da CABEÇA** — abaixo dela é pescoço.
 *
 * O que fica de fora não é perda silenciosa: `construirPeca` conta os candidatos
 * descartados e os imprime, como já faz no traje.
 */
export function noCampoDoChapeu(x: number, y: number): boolean {
  if (y < CAIXA_DA_ARTE.y) return false;
  if (x < CAIXA_DA_ARTE.x || x > CAIXA_DA_ARTE.x + CAIXA_DA_ARTE.w) return false;
  // No meio, o olho manda. Nas laterais, a base da cabeça.
  const naColunaDasFeicoes = x >= CAIXA_DAS_FEICOES.x0 && x <= CAIXA_DAS_FEICOES.x1;
  return y <= (naColunaDasFeicoes ? CAIXA_DAS_FEICOES.y0 : CAIXA_CABECA.y1);
}

// ---------------------------------------------------------------------------
// O CAMPO DO ÓCULOS — o terceiro slot de `<image>`, e o primeiro que mora NO ROSTO
// ---------------------------------------------------------------------------
//
// Traje e chapéu evitam as feições por construção: um mora no tronco, o outro para
// no piso do olho. O óculos **é a peça que senta em cima delas** — a armação cerca os
// dois olhos e passa entre eles e a boca. Então o campo dele é o primeiro que precisa
// dizer, com todas as letras, o que ele NÃO é.

/**
 * O VÃO DA LENTE — o que um furo cercado pode ter dentro para continuar aberto.
 *
 * É a cápsula do olho e a espinha da boca, as mesmas duas formas que a esteira tonal
 * protege desde 2026-08-20 (`naCapsulaDoOlho`, `naEspinhaDaBoca`). Aqui elas mudam de
 * papel: lá elas dizem *"a peça não pinta aqui"*; aqui dizem *"o furo que contém isto
 * é DESENHO, não falha da régua"*.
 *
 * A diferença entre os dois papéis é o que decide a peça. Como campo, elas protegem
 * 38 × 83 u por olho e o resto do vão da lente é assado assim mesmo — 23 038 px de
 * pele da base dentro da armação, medidos em 2026-08-27. Como janela, o vão inteiro
 * fica aberto e a pele que aparece por ele é a que o aluno escolheu.
 */
export const noVaoDaLente = (x: number, y: number): boolean =>
  naCapsulaDoOlho(x, y) || naEspinhaDaBoca(x, y);

/**
 * ONDE UM ÓCULOS PODE LEGITIMAMENTE EXISTIR.
 *
 * Três fronteiras, e nenhuma delas é a feição — a feição é `janela`, não campo:
 *
 *  - **dos lados e em cima, a `CAIXA_DA_ARTE`.** A armação PODE passar da cabeça, e
 *    isso é decisão do Doug (2026-08-27, *"não importa se passar um pouco da
 *    cabeça"*): a peça de rosto fica fora de todo clip, e o primeiro óculos mede
 *    **x 99,2 → 485,8** numa cabeça que vai de 75,2 a 439,2. Fechar o campo na
 *    cabeça cortaria 46,6 u de armação legítima;
 *  - **em cima, a cabeça.** Acima dela é ar, e óculos erguido na testa é peça de
 *    CHAPÉU neste catálogo (`chapeu-oculos-de-forja`, doc 22 §5-C) — outro slot,
 *    outro campo;
 *  - **embaixo, o PISO DO TRAJE.** Ver abaixo: ele era a base da cabeça, e o Doug o
 *    derrubou no mesmo dia em que o slot nasceu.
 *
 * ---------------------------------------------------------------------------
 * O PISO ERA O QUEIXO, E A CORRENTE NÃO CABIA NELE
 * ---------------------------------------------------------------------------
 *
 * A primeira versão parava em `CAIXA_CABECA.y1` (347,2) com o argumento *"abaixo
 * dela começa pescoço, e nada que um óculos faça desce até lá"*. **A frase estava
 * errada, e o contra-exemplo estava na terceira arte do próprio lote:** óculos de
 * leitura têm CORRENTE, e corrente desce.
 *
 * O Doug, olhando o render: *"a corrente que desce do aro… eu quero que eles
 * apareçam."* Medido no lote de 2026-08-27, separando o que está LIGADO à peça do
 * que é ruído solto do gerador:
 *
 * | arte | ligado à peça e recusado | onde | solto |
 * |---|---|---|---|
 * | `oculos-1` | 0 px | — | 165 px |
 * | `oculos-2` | **950 px** | u x 99→123, até y 386 | 64 px |
 * | `oculos-3` | **4 818 px** | u x 376→484, até y 445 | 38 px |
 * | `oculos-4` | 0 px | — | 165 px |
 * | `oculos-5` | 0 px | — | 195 px |
 *
 * ⚠️ **Eu tinha chamado esses pixels de "ruído do gerador no tronco" e estava
 * errado.** A régua que separa as duas coisas não é a altura: é a CONECTIVIDADE.
 * Corrente encosta no aro; ruído de reencode não encosta em nada. E ela já existe —
 * `extrairPorCampo` descarta componente com menos de `PISO_SOLTA` (5%) da maior, e
 * 38 a 195 px contra 30 mil não chegam perto. **Baixar o piso não deixa o ruído
 * entrar**, porque não é o piso que o segurava.
 *
 * O novo piso é o do TRAJE (`noCampoDoTraje`): a base da silhueta mais
 * `TRANSBORDO_BARRA`. Não é número escolhido — é teto já publicado, e abaixo dele
 * mora a sombra do chão, onde corrente nenhuma chega.
 *
 * ⚠️ **A camada permite isto, e foi conferido antes:** `rosto-sobre-cabelo` é
 * emitida DEPOIS de `traje-arte` e de `tronco-tinta` (`camadas.ts`), então a
 * corrente aparece sobre o peito. Só `traje-extensoes-frente` vem por cima dela —
 * uma gola alta pode cobrir a ponta da corrente, e isso é oclusão de roupa, que é o
 * que roupa faz.
 *
 * ⚠️ **A cápsula do olho e a boca NÃO saem daqui, e isso é o contrário do que a
 * primeira versão fez.** Tirá-las do campo protege a feição e não protege a lente:
 * o vão é muito maior que a cápsula, e o resto dele é assado. Quem responde por isso
 * é `noVaoDaLente` como `SlotDeArte.janela`. Deixá-las no campo tem custo declarado —
 * uma armação que encoste no olho pinta por cima dele —, e é o Gate −1 que pega isso,
 * medindo REPINTURA das feições, que é onde essa pergunta sempre morou.
 */
export function noCampoDoOculos(x: number, y: number): boolean {
  if (x < CAIXA_DA_ARTE.x || x > CAIXA_DA_ARTE.x + CAIXA_DA_ARTE.w) return false;
  if (y < CAIXA_CABECA.y0) return false;
  return y <= TRONCO.yBase + TRACO / 2 + TRANSBORDO_BARRA;
}

/** O canvas inteiro, em unidades. Serve de universo para as contas de área. */
export const CANVAS_EM_UNIDADES: Caixa = (() => {
  const a = paraUnidade(0, 0);
  const b = paraUnidade(LADO, LADO);
  return { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
})();

export const dentroDa = (c: Caixa, x: number, y: number) =>
  x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1;

/**
 * O papel de um pixel — e ele NÃO É MAIS UM SÓ, desde o Bloco 12.
 *
 * As regiões respondem a duas perguntas diferentes, e a partir do Bloco 12 elas
 * respondem coisas diferentes:
 *
 *  - **para o Gate −1**: `rosto` e `corpo` reprovam. Ali a pergunta é *"o gerador
 *    mexeu no boneco?"*, e mexer no tronco é tão defeito quanto mexer no olho.
 *    Quem lê esta lista é `REGIOES_QUE_REPROVAM`, e ela não mudou;
 *  - **para a EXTRAÇÃO**: só `rosto` recorta. A pergunta ali é outra — *"que
 *    pixels são a peça?"* — e cabelo caindo sobre a roupa é peça. Ver
 *    `mascaraDaPeca` (`extrair.ts`), que é o único lugar onde essa distinção mora.
 *
 * `sobrancelha` só relata, nos dois casos.
 */
export type Regiao = "rosto" | "corpo" | "sobrancelha" | "permitida";

/**
 * As duas que reprovam **no Gate −1**. A lista existe para ninguém confundir com a
 * de cima — e desde o Bloco 12 ela também não se confunde com a da extração, que
 * é menor e mora em `extrair.ts`.
 */
export const REGIOES_QUE_REPROVAM: readonly Regiao[] = ["rosto", "corpo"];

export function regiaoDoPixel(xPx: number, yPx: number): Regiao {
  const { x, y } = paraUnidade(xPx, yPx);
  if (dentroDa(ROSTO, x, y)) return "rosto";
  if (noCorpo(x, y)) return "corpo";
  if (dentroDa(SOBRANCELHAS, x, y)) return "sobrancelha";
  return "permitida";
}

// ---------------------------------------------------------------------------
// A base como arquivo
// ---------------------------------------------------------------------------

export const PASTA = "scripts/avatar/arte";
export const PNG_BASE = `${PASTA}/base-oficial.png`;
export const SVG_BASE = `${PASTA}/base-oficial.svg`;
export const MANIFESTO = `${PASTA}/base-oficial.json`;

/**
 * ONDE OS ARTEFATOS DE UMA ARTE MORAM — uma pasta por arte, derivada do nome.
 *
 * A rota nasceu com uma arte só e escrevia em `peca/`, `contorno/` e `bancada/`
 * fixos. Com três artes isso deixa de ser detalhe e vira perda de dado: rodar a
 * segunda sobrescreve os artefatos da primeira, e o pior caso é o `converter`,
 * que escreve `peca/peca.ts` da arte nova dentro da pasta com as máscaras da
 * arte velha — uma pasta afirmando duas coisas.
 *
 * `PASTA` continua onde estava de propósito: `base-oficial.png` e o manifesto
 * são UM só para todas as artes, e é contra esse hash que o Gate −1 confere que
 * o Doug editou sobre a base certa. Só as saídas se separam.
 */
export const saidaDaArte = (arte: string) =>
  `${PASTA}/${(arte.split(/[\\/]/).pop() ?? arte).replace(/\.png$/i, "")}`;

/**
 * Embrulha o SVG do compositor no canvas do Gemini.
 *
 * O `<svg>` interno entra com `x`/`y`/`width`/`height` e mantém o `viewBox`
 * dele intacto — nada do que `compor()` emitiu é reescrito, o que é o requisito
 * de a base ser **o render real do produto** e não uma imitação dele.
 */
export function embrulhar(svgInterno: string, semRecorte = false): string {
  const w = VIEWBOX.w * ESCALA;
  const h = VIEWBOX.h * ESCALA;
  // `overflow="visible"` DESLIGA A GUILHOTINA DO `viewBox`, e existe para uma
  // pergunta só: *"a peça tem a forma da arte?"*.
  //
  // A arte é desenhada nas 92 px de folga que o canvas deixa acima do `viewBox`,
  // e uma peça de ponta alta mora lá. Renderizada com o recorte de sempre, ela
  // volta cortada em reta — e a comparação passa a medir o viewport em vez do
  // traçado. **Recortar continua sendo o padrão**, porque é o que o produto faz;
  // quem desliga está perguntando outra coisa e declara isso na chamada.
  const posto = svgInterno.replace(
    /<svg /,
    `<svg x="${ORIGEM.x}" y="${ORIGEM.y}" width="${w}" height="${h}" ` +
      (semRecorte ? `overflow="visible" ` : ``),
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}" ` +
    `width="${LADO}" height="${LADO}">` +
    `<rect width="${LADO}" height="${LADO}" fill="${FUNDO}"/>` +
    posto +
    `</svg>`
  );
}

/** Selo curto de conteúdo. A mesma ideia dos selos de folha do projeto. */
export const selo = (conteudo: string | Buffer) =>
  createHash("sha256").update(conteudo).digest("hex");
