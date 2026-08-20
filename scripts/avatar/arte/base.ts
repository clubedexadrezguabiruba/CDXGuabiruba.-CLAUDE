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
  CENTRO_X,
  EIXO_ROSTO,
  OLHO,
  OLHO_CX_DIR,
  OLHO_CX_ESQ,
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
 * AS FEIÇÕES, UMA CAIXA CADA — e `ROSTO` acima é exatamente a caixa delas TODAS.
 *
 * ---------------------------------------------------------------------------
 * POR QUE UMA CAIXA SÓ NÃO SERVE PARA A PEÇA QUE VESTE A CARA
 * ---------------------------------------------------------------------------
 *
 * O conjunto que precisa ser protegido — dois olhos e uma boca — **não é convexo**:
 * a boca fica embaixo e no meio, os olhos em cima e nas pontas, e os quatro cantos
 * da caixa que os envolve estão vazios. Para o CABELO isso nunca importou, porque
 * cabelo não desce até ali. Para a BARBA importa, e custou um defeito:
 *
 * a `barba-cheia` entra no canto inferior direito de `ROSTO` (u x 378,3→393,3 ·
 * y 300,8→308,3), que fica **84 px abaixo do olho direito** e **67 u à direita da
 * boca** — não encosta em feição nenhuma. Recortada pela caixa, a peça perdeu
 * 217 px e, pior, o corte passou pelo MIOLO dela: sobraram **27 px de aresta nua**,
 * massa terminando sem o contorno preto que o gerador pintou. O Doug viu a olho
 * ("falta um contorno no lado direito, abaixo do olho direito") antes de qualquer
 * régua — de novo.
 *
 * ---------------------------------------------------------------------------
 * ELAS SAEM DAS MESMAS CONSTANTES QUE `ROSTO`, E ISSO É A AMARRA
 * ---------------------------------------------------------------------------
 *
 * Mesmos `OLHO`, `BOCA` e `FOLGA` de meio traço. Uma segunda descrição das feições
 * concordaria com a INTENÇÃO em vez de concordar com o código — é a lição que
 * `base-oficial.ts` já registra e o motivo de `base-barba.ts` ler estas constantes
 * em vez de redesenhar as caixas.
 *
 * **`ROSTO` fica como está, e é de propósito.** Ele é o que o Gate −1 e a extração
 * de cabelo medem desde sempre; trocá-lo moveria as peças já promovidas e o próprio
 * gate. Quem precisa da régua fina é a peça de rosto, e é ela que pede por estas.
 * O achado geral continua registrado como **G32**.
 */
export const FEICOES: readonly Caixa[] = [
  {
    x0: OLHO_CX_ESQ - OLHO.w / 2 - FOLGA,
    y0: OLHO.cy - OLHO.h / 2 - FOLGA,
    x1: OLHO_CX_ESQ + OLHO.w / 2 + FOLGA,
    y1: OLHO.cy + OLHO.h / 2 + FOLGA,
  },
  {
    x0: OLHO_CX_DIR - OLHO.w / 2 - FOLGA,
    y0: OLHO.cy - OLHO.h / 2 - FOLGA,
    x1: OLHO_CX_DIR + OLHO.w / 2 + FOLGA,
    y1: OLHO.cy + OLHO.h / 2 + FOLGA,
  },
];

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
export const MEIA_ESPINHA = 1 / ESCALA;

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
