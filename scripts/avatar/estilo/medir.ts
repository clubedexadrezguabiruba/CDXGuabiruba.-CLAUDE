/**
 * A RÉGUA — mede um boneco em pixel, e mede a referência com a MESMA função.
 *
 * Este arquivo existe por causa de um defeito concreto: a base do Bloco 1 passou
 * na folha de contato e estava errada em oito proporções. A folha compara duas
 * imagens lado a lado, e **olho não mede proporção** — ele mede traço, cor e
 * presença. Os oito defeitos (cabeça chata demais no ápice, olho 22% estreito,
 * sombra do chão com metade do tamanho, tronco pouco afunilado, orelhas
 * simétricas, olhos centrados, plano lateral virando mancha diagonal, eixo da
 * cabeça alinhado ao do tronco) passaram todos por baixo dela.
 *
 * ---------------------------------------------------------------------------
 * A SILHUETA É O CONTORNO ESCURO, E ISSO NÃO É DETALHE
 * ---------------------------------------------------------------------------
 *
 * A fronteira de um boneco poderia ser lida por "pixel diferente do fundo". Na
 * referência isso mede errado, e o erro é grande: a **sombra do chão** é tinta
 * clara (luminância 227 contra 249 do fundo) e entra na conta, engordando a
 * figura em ~60 px justamente na base. Foi assim que a altura útil da referência
 * saiu 837 px numa medição anterior quando o valor certo é 896 — e todo número
 * derivado dela ficou 7% grande.
 *
 * Aqui a silhueta é **o primeiro e o último pixel escuro de cada linha**
 * (luminância < `ESCURO`). O contorno do estilo kokeshi é preto-marrom espesso e
 * fecha a figura inteira; a sombra do chão nunca chega perto de escura. A mesma
 * regra vale para o SVG que nós emitimos, cujo `stroke` é `LINHA` — que desde o
 * Bloco 1d é `#000000`, luminância 0, contra os 3,0 medidos no traço da
 * referência. Referência e render medidos pela mesma régua.
 *
 * ---------------------------------------------------------------------------
 * TUDO SAI EM UNIDADES DO VIEWBOX, NORMALIZADO SÓ PELA ALTURA
 * ---------------------------------------------------------------------------
 *
 * Cada medida é multiplicada por `600 / alturaUtil`, onde a altura útil é do topo
 * do contorno da cabeça à base do contorno do tronco. **Nunca pela largura.**
 * Normalizar pelos dois eixos faria uma cabeça 9% estreita virar erro zero — que
 * é exatamente o defeito que este arquivo existe para pegar.
 */

/** Luminância abaixo da qual um pixel é contorno. */
export const ESCURO = 80;

/** A altura útil canônica, em unidades do `viewBox`. Toda medida é escalada para cá. */
export const ALTURA_CANONICA = 600;

export interface Bitmap {
  data: Buffer;
  w: number;
  h: number;
  canais: number;
}

export function lum(b: Bitmap, x: number, y: number): number {
  const i = (y * b.w + x) * b.canais;
  return 0.2126 * b.data[i] + 0.7152 * b.data[i + 1] + 0.0722 * b.data[i + 2];
}

/** Primeiro e último pixel escuro de cada linha. `null` onde não há contorno. */
export interface Linha {
  x0: number;
  x1: number;
  larg: number;
}

export function silhueta(b: Bitmap): (Linha | null)[] {
  const out: (Linha | null)[] = [];
  for (let y = 0; y < b.h; y++) {
    let x0 = -1;
    let x1 = -1;
    for (let x = 0; x < b.w; x++) {
      if (lum(b, x, y) < ESCURO) {
        if (x0 < 0) x0 = x;
        x1 = x;
      }
    }
    out.push(x0 < 0 ? null : { x0, x1, larg: x1 - x0 + 1 });
  }
  return out;
}

// ---------------------------------------------------------------------------
// O ENQUADRAMENTO — os quatro números dos quais todo o resto deriva
// ---------------------------------------------------------------------------

/**
 * ONDE A FIGURA COMEÇA, ONDE ELA ACABA, E QUANTO VALE UM PIXEL.
 *
 * Extraído de dentro de `medir()` no Bloco 2a.2, e a extração é o ponto: este
 * cálculo estava **copiado em quatro lugares** — aqui, em `folha-base.ts` (como a
 * constante `REF`), e em dois scripts de `.scratch/estilo`. Quatro cópias de um
 * enquadramento cuja divergência muda **toda** medida derivada, que é a mesma
 * família de defeito que a silhueta duplicada já custou seis vezes a este projeto.
 *
 * O número que prova o risco já aconteceu: uma medição anterior leu a altura útil
 * como 837 px onde o valor é 896, porque lia a silhueta como "pixel diferente do
 * fundo" e a sombra do chão é tinta clara. Todo derivado saiu 7% grande. Com uma
 * cópia só, esse erro se conserta uma vez.
 *
 * `yCorte` é a linha mais estreita entre 40% e 78% da altura — o pescoço. Não é
 * "a metade": numa figura de cabeça grande a metade cai dentro do crânio.
 */
export interface Enquadramento {
  /** A silhueta linha a linha, já calculada — quem chama não precisa refazer. */
  linhas: (Linha | null)[];
  /** Primeira e última linha com contorno escuro. */
  utilY0: number;
  utilY1: number;
  alturaUtilPx: number;
  /** Multiplicador de pixel para unidade do `viewBox`: `600 / alturaUtilPx`. */
  fator: number;
  /** A linha do pescoço: a mais estreita entre 40% e 78% da altura útil. */
  yCorte: number;
  /** O eixo do TRONCO, em pixel. Não é o eixo da figura — a cabeça tem o dela. */
  eixoTroncoPx: number;
}

export function enquadramento(b: Bitmap): Enquadramento {
  const linhas = silhueta(b);
  const ys: number[] = [];
  for (let y = 0; y < b.h; y++) if (linhas[y]) ys.push(y);
  if (ys.length < 20) throw new Error("enquadramento: quase nenhum contorno escuro na imagem");

  const utilY0 = ys[0];
  const utilY1 = ys[ys.length - 1];
  const alturaUtilPx = utilY1 - utilY0 + 1;

  let yCorte = utilY0 + Math.round(alturaUtilPx * 0.5);
  let menor = Infinity;
  for (
    let y = utilY0 + Math.round(alturaUtilPx * 0.4);
    y <= utilY0 + Math.round(alturaUtilPx * 0.78);
    y++
  ) {
    const l = linhas[y];
    if (l && l.larg < menor) {
      menor = l.larg;
      yCorte = y;
    }
  }

  // O eixo sai da linha MAIS LARGA abaixo do corte — o ombro. Tomar o meio de uma
  // linha qualquer do tronco daria um eixo que anda com o afunilamento.
  let tMax = 0;
  let tx0 = 0;
  let tx1 = 0;
  for (let y = yCorte; y <= utilY1; y++) {
    const l = linhas[y];
    if (l && l.larg > tMax) {
      tMax = l.larg;
      tx0 = l.x0;
      tx1 = l.x1;
    }
  }

  return {
    linhas,
    utilY0,
    utilY1,
    alturaUtilPx,
    fator: ALTURA_CANONICA / alturaUtilPx,
    yCorte,
    eixoTroncoPx: (tx0 + tx1) / 2,
  };
}

// ---------------------------------------------------------------------------
// A LINHA DE CENTRO — a irmã de `silhueta()`, e o que ela enxerga a mais
// ---------------------------------------------------------------------------

/**
 * Uma corrida de tinta: um trecho contíguo de pixels escuros, com o **centro** (a
 * linha que o desenhista traçou) e a **largura** (a espessura do traço ali).
 */
export interface Corrida {
  x0: number;
  x1: number;
  centro: number;
  espessura: number;
}

/**
 * As corridas de tinta ao longo de uma varredura.
 *
 * `silhueta()` devolve o primeiro e o último pixel escuro da linha — a fronteira
 * externa. Isto devolve **cada travessia de traço**, e a diferença é o que separa
 * três perguntas que a silhueta externa não sabe responder:
 *
 *  - **onde passa a linha?** No centro da corrida, e não meio traço para fora dela.
 *    Guardar centro em vez de silhueta é o que faz `TRACO` deixar de mexer na
 *    geometria;
 *  - **quanto mede o traço?** A largura da corrida, medida em vez de estimada;
 *  - **quantos traços existem aqui?** A contagem. Uma orelha que interrompe o
 *    contorno da cabeça e uma orelha colada por cima dele têm a **mesma silhueta
 *    externa** e contagens diferentes — 1 contra 2. Foi por essa cegueira que o
 *    gate do Bloco 1b aprovou uma orelha lendo como peça colada atrás.
 *
 * Corridas de 1 px são descartadas: são a rampa de antialiasing tocando o limiar.
 *
 * `amostra` é indireta de propósito — a MESMA função varre uma linha e uma coluna.
 * Onde a borda é quase horizontal a varredura horizontal atravessa o traço na
 * diagonal e mede até 6× a espessura real; lá quem vale é a coluna.
 */
export function corridas(n: number, amostra: (i: number) => boolean): Corrida[] {
  const out: Corrida[] = [];
  let inicio = -1;
  for (let i = 0; i <= n; i++) {
    const escuro = i < n && amostra(i);
    if (escuro && inicio < 0) inicio = i;
    if (!escuro && inicio >= 0) {
      const fim = i - 1;
      if (fim - inicio + 1 > 1)
        out.push({ x0: inicio, x1: fim, centro: (inicio + fim) / 2, espessura: fim - inicio + 1 });
      inicio = -1;
    }
  }
  return out;
}

export const naLinha = (b: Bitmap, y: number): Corrida[] =>
  corridas(b.w, (x) => lum(b, x, y) < ESCURO);

export function naColuna(b: Bitmap, x: number, yDe: number, yAte: number): Corrida[] {
  return corridas(yAte - yDe + 1, (i) => lum(b, x, yDe + i) < ESCURO).map((c) => ({
    x0: c.x0 + yDe,
    x1: c.x1 + yDe,
    centro: c.centro + yDe,
    espessura: c.espessura,
  }));
}

// ---------------------------------------------------------------------------
// AS FACETAS — achar a ARESTA, sem supor de que lado ela é mais escura
// ---------------------------------------------------------------------------

/**
 * A partição ótima de um vetor em **três segmentos de valor constante**, por erro
 * quadrático mínimo. Devolve os dois cortes e a média de cada segmento.
 *
 * ---------------------------------------------------------------------------
 * ESTA FUNÇÃO EXISTE PORQUE A PERGUNTA ANTERIOR ESTAVA ERRADA
 * ---------------------------------------------------------------------------
 *
 * O plano lateral do Bloco 1b era procurado assim: *"a partir da borda, quantos
 * pixels seguidos estão mais escuros que o platô do rosto?"* (`banda()`, mais
 * abaixo). A resposta na referência, do lado esquerdo, foi **zero** — e a conclusão
 * tirada dela foi que não existia faceta esquerda. O Doug reprovou a base por
 * exatamente isso: *"não há sombreamento lateral do rosto do lado esquerdo, efeito
 * cubo, e é um dos principais fatores para entender que o rosto está de lado"*.
 *
 * A faceta existe em **toda** a altura do rosto. O que muda é o tom dela, que
 * **atravessa** o tom frontal: mais clara que o rosto em cima (+15 níveis), mais
 * escura embaixo (−32). Uma pergunta com o sinal embutido — "mais escuro que" — é
 * cega para metade disso por construção, e mede zero onde os dois se cruzam.
 *
 * A pergunta certa não tem sinal: **onde está a descontinuidade?** Uma partição
 * ótima acha o corte pelo salto de tom, para qualquer sinal, e enxerga uma faceta
 * mais clara tão bem quanto uma mais escura. É a lição do bloco em uma função.
 *
 * O custo é O(n²) e n é a largura do rosto em pixel — alguns milhares de operações
 * por linha, num script que roda sob demanda.
 */
export interface Particao {
  /** Os `k−1` índices de corte. */
  cortes: number[];
  /** A média de cada um dos `k` segmentos. */
  medias: number[];
  /** O comprimento de cada segmento. */
  larguras: number[];
}

export function particao(v: number[], k: number): Particao {
  const n = v.length;
  if (n < k * 2) throw new Error(`particao: vetor de ${n} curto demais para ${k} segmentos`);

  // Somas de prefixo: o erro quadrático de um segmento sai em tempo constante.
  const s = new Float64Array(n + 1);
  const s2 = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    s[i + 1] = s[i] + v[i];
    s2[i + 1] = s2[i] + v[i] * v[i];
  }
  const erro = (a: number, b: number) => {
    const m = b - a;
    if (m <= 0) return 0;
    const soma = s[b] - s[a];
    return Math.max(0, s2[b] - s2[a] - (soma * soma) / m);
  };

  // `melhor[j][i]` = erro mínimo de partir v[0..i) em j segmentos.
  const melhor: Float64Array[] = [];
  const de: Int32Array[] = [];
  for (let j = 0; j <= k; j++) {
    melhor.push(new Float64Array(n + 1).fill(Infinity));
    de.push(new Int32Array(n + 1));
  }
  melhor[0][0] = 0;
  for (let j = 1; j <= k; j++) {
    for (let i = j; i <= n; i++) {
      for (let p = j - 1; p < i; p++) {
        const e = melhor[j - 1][p] + erro(p, i);
        if (e < melhor[j][i]) {
          melhor[j][i] = e;
          de[j][i] = p;
        }
      }
    }
  }

  const cortes: number[] = [];
  let i = n;
  for (let j = k; j > 0; j--) {
    const p = de[j][i];
    if (j > 1) cortes.unshift(p);
    i = p;
  }
  const limites = [0, ...cortes, n];
  const medias: number[] = [];
  const larguras: number[] = [];
  for (let j = 0; j < k; j++) {
    const a = limites[j];
    const b = limites[j + 1];
    medias.push(b > a ? (s[b] - s[a]) / (b - a) : 0);
    larguras.push(b - a);
  }
  return { cortes, medias, larguras };
}

// ---------------------------------------------------------------------------
// Os marcos
// ---------------------------------------------------------------------------

export interface Caixa {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  cx: number;
  cy: number;
  larg: number;
  alt: number;
}

export interface Marcos {
  /** Fator px → unidades. Tudo abaixo já vem multiplicado por ele. */
  fator: number;
  alturaUtilPx: number;
  cabeca: Caixa;
  tronco: {
    cx: number;
    largOmbro: number;
    largMax: number;
    /** Fração da altura do tronco onde ele é mais largo. 0 = ombro, 1 = base. */
    fracLargMax: number;
    largBase: number;
  };
  olhos: {
    esq: Caixa;
    dir: Caixa;
    /** Ponto médio dos dois olhos menos o eixo da cabeça. Positivo = à direita. */
    desvioDoEixo: number;
    /** Quanto o olho DIREITO está mais alto que o esquerdo. */
    desnivel: number;
    separacao: number;
  };
  /** Eixo da cabeça menos eixo do tronco. Positivo = cabeça à direita. */
  giroDoEixo: number;
  /** Largura da faixa escura junto à borda, medida em três alturas da cabeça. */
  planoLateral: { fracAltura: number; esq: number; dir: number }[];
  /** O mesmo, no tronco. */
  planoLateralTronco: { fracAltura: number; esq: number; dir: number }[];
  /**
   * AS QUATRO FACETAS DO ROSTO — largura e desnível de tom contra o platô frontal.
   *
   * O rosto da referência é um **cubo**, não um cilindro: uma faceta frontal, uma
   * esquerda larga (a que vira para o observador), uma direita estreita (a que
   * foge), e o queixo. A razão entre as larguras das duas laterais *é* o giro, e é
   * um dado independente da silhueta — dois desenhos com o mesmo contorno externo
   * podem ter um o rosto virado e o outro chapado.
   *
   * `topo` e `base` são duas janelas de altura, e o desnível muda muito entre elas:
   * é isso que obriga cada faceta a ser um gradiente vertical em vez de tom chapado.
   *
   * ---------------------------------------------------------------------------
   *
   * **`plato` vem junto, e comparar sem ele dá errado.** O sombreamento é
   * multiplicativo: uma faceta é a superfície refletindo menos luz, então o que se
   * conserva entre duas peles é a RAZÃO, não o desnível absoluto. O rosto da
   * referência tem luminância 221; o boneco renderizado com `PELE[2]` tem 185,6. A
   * mesma faceta de −28 na referência sai −24 ali, e um gate que comparasse os dois
   * números crus reprovaria um desenho correto — e aprovaria um errado numa pele
   * clara. Quem compara divide pelo próprio platô.
   */
  facetas: {
    topo: { largEsq: number; deltaEsq: number; largDir: number; deltaDir: number; plato: number };
    base: { largEsq: number; deltaEsq: number; largDir: number; deltaDir: number; plato: number };
    /** A faixa escura no fim do rosto, acima do contorno. Altura e desnível. */
    queixo: { altura: number; delta: number; plato: number };
    /** A sombra projetada da cabeça no tronco, abaixo do contorno. A mais escura. */
    sombraQueixo: { altura: number; delta: number; plato: number };
  };
  /** Espessura do contorno, corrigida pela inclinação da borda. */
  espessuraTraco: number;
  /**
   * Queda de luminância na coluna central do rosto contra o platô do interior.
   * Perto de 0 é o certo: a referência tem um PLANO na lateral, não uma mancha
   * atravessando o rosto.
   */
  faixaNoEixo: number;
  /**
   * A sombra do chão, medida ABAIXO da base do tronco.
   *
   * Ela não aparece na silhueta de propósito — a silhueta é o contorno escuro, e
   * a sombra é tinta clara. Mas ela foi **dois** dos oito defeitos da base
   * anterior (metade do tamanho, e deslocada quando devia ser centrada), então
   * precisa de medida própria. `desvio` é contra o eixo do tronco: perto de zero
   * é o certo.
   */
  sombra: { larg: number; desvio: number; escurecimento: number };
  /**
   * NÃO EXISTE MEDIDA DO ESPECULAR AQUI, e a ausência é uma decisão.
   *
   * Tentar medi-la devolveu, na referência, uma mancha de 241 × 54 unidades —
   * ou seja, quase metade da cabeça. Não é erro do detector: a referência tem a
   * metade de cima levemente mais clara ao longo de toda a largura, e o
   * "especular" que se vê é a ponta desse gradiente. Reproduzir isso exigiria a
   * rampa contínua que a §2a do plano recusa POR MEDIÇÃO (o interior é chapado
   * em 221 ao longo de 90% da largura).
   *
   * Medir mal é pior que não medir: um marco que reporta "241" e é comparado
   * contra a vírgula de 52 unidades que desenhamos reprovaria para sempre por um
   * motivo que ninguém pretende corrigir. Fica de fora, declarado.
   */
  /**
   * O perfil externo por linha, indexado pela fração da altura útil.
   *
   * `esq` e `dir` são as distâncias de cada borda ao **eixo do tronco**, e não a
   * largura total. A distinção é o que faz o perfil enxergar deriva de eixo: uma
   * cabeça deslocada 8 unidades para a direita tem exatamente a mesma largura em
   * toda altura, e passa batido num gate que só compara `larg`. Foi assim que o
   * "eixo escorrendo no quarto de baixo" ficou verde no Bloco 1b.
   */
  perfil: { frac: number; larg: number; esq: number; dir: number; orelha: boolean }[];
}

/** Quantas amostras o perfil tem. 240 dá ~2,5 unidades de passo em 600. */
const AMOSTRAS = 240;

/**
 * Mede um boneco inteiro.
 *
 * A ordem importa: a altura útil sai primeiro porque tudo depende do fator; o
 * corte cabeça↔tronco sai da linha mais ESTREITA do meio da figura (o ombro
 * escondido sob a cabeça), que é um mínimo inequívoco nos dois desenhos.
 */
export function medir(b: Bitmap): Marcos {
  // O enquadramento é função própria desde o Bloco 2a.2 — ver o docstring dela para
  // por que quatro cópias deste cálculo eram um risco e não uma repetição inocente.
  const { linhas, utilY0, utilY1, alturaUtilPx, fator, yCorte } = enquadramento(b);
  const u = (v: number) => v * fator;

  const L = (y: number) => linhas[y] as Linha;

  // --- a cabeça, SEM as orelhas: a maior largura do terço superior ---
  const topo0 = utilY0;
  const topo1 = utilY0 + Math.round((yCorte - utilY0) * 0.42);
  let nucleo = 0;
  for (let y = topo0; y <= topo1; y++) if (linhas[y] && L(y).larg > nucleo) nucleo = L(y).larg;
  let cx0 = Infinity;
  let cx1 = -Infinity;
  for (let y = topo0; y <= topo1; y++) {
    const l = linhas[y];
    if (l && l.larg >= nucleo - 1) {
      cx0 = Math.min(cx0, l.x0);
      cx1 = Math.max(cx1, l.x1);
    }
  }
  // a base da cabeça é a última linha antes do corte
  const cabecaY1 = yCorte - 1;
  const cabeca: Caixa = {
    x0: u(cx0),
    x1: u(cx1),
    y0: u(utilY0),
    y1: u(cabecaY1),
    cx: u((cx0 + cx1) / 2),
    cy: u((utilY0 + cabecaY1) / 2),
    larg: u(cx1 - cx0 + 1),
    alt: u(cabecaY1 - utilY0 + 1),
  };

  // --- o tronco ---
  let tMax = 0;
  let tMaxY = yCorte;
  let tx0 = 0;
  let tx1 = 0;
  for (let y = yCorte; y <= utilY1; y++) {
    const l = linhas[y];
    if (l && l.larg > tMax) {
      tMax = l.larg;
      tMaxY = y;
      tx0 = l.x0;
      tx1 = l.x1;
    }
  }
  // A "base" é a 90% da altura do tronco, e não a última linha: a última linha é
  // a ponta do arremate arredondado, onde a largura tende a zero e não descreve
  // nada. 90% é onde o afunilamento já aconteceu e a curva ainda é legível.
  const baseY = Math.min(utilY1, yCorte + Math.round((utilY1 - yCorte) * 0.9));
  const tronco = {
    cx: u((tx0 + tx1) / 2),
    largOmbro: u(L(yCorte).larg),
    largMax: u(tMax),
    fracLargMax: (tMaxY - yCorte) / Math.max(1, utilY1 - yCorte),
    largBase: u(L(baseY).larg),
  };

  // --- os olhos: escuro DENTRO do rosto, longe do contorno ---
  //
  // Aqui a margem é generosa (9% da largura da cabeça) porque o alvo é achar
  // olho, e empurrar a varredura para bem dentro do rosto evita confundir o
  // contorno com pupila. O plano lateral usa outra régua, logo abaixo: ele
  // começa exatamente onde o traço termina, e por isso a espessura do traço é
  // MEDIDA em vez de estimada.
  const margem = Math.round((cx1 - cx0) * 0.09);

  /**
   * Espessura do contorno naquela linha, varrendo do lado `lado` (+1 = da
   * esquerda para dentro, −1 = da direita para dentro).
   *
   * É medida, e não uma fração fixa da cabeça, porque é dela que depende de onde
   * a leitura do plano lateral começa. Com uma fração fixa, o mesmo desenho mede
   * faixas diferentes conforme a espessura do traço, e aí referência e render
   * deixam de ser comparáveis — que é a única coisa que este arquivo promete.
   */
  function espessura(y: number, lado: 1 | -1): number {
    const l = linhas[y];
    if (!l) return 0;
    let n = 0;
    for (let x = lado === 1 ? l.x0 : l.x1; x >= 0 && x < b.w; x += lado) {
      if (lum(b, x, y) >= ESCURO) break;
      n++;
      if (n > 80) break;
    }
    return n;
  }
  // A BANDA DE BUSCA APERTOU NO BLOCO 1d, E APERTAR É O CONSERTO.
  //
  // Ela ia de 0,28 a 0,84 quando a única tinta dentro do rosto eram os olhos
  // (`fracCab` 0,481–0,756). A arte nova tem **sobrancelhas em 0,398–0,438** e
  // **boca em 0,822–0,844**, e as duas caíam dentro da janela antiga.
  //
  // O estrago não é achar um terceiro grupo — os "dois maiores" continuariam sendo
  // os olhos. É que a sobrancelha fica **na mesma coluna** do olho de baixo, então
  // ela entra no grupo dele, e `caixaOlho()` mede a caixa da coluna inteira: a
  // **altura do olho** sai medindo da sobrancelha até o fim do olho. Medido na arte
  // nova com a janela velha: 108,5 unidades de altura e 46,4 de largura, contra os
  // 82 e 37 reais. Um marco com 33% de erro, e verde, porque o número esperado sai
  // da mesma leitura errada na referência.
  //
  // 0,46–0,78 abraça os olhos e não alcança nem a sobrancelha nem a boca.
  const oy0 = utilY0 + Math.round((cabecaY1 - utilY0) * 0.46);
  const oy1 = utilY0 + Math.round((cabecaY1 - utilY0) * 0.78);
  const colunas = new Set<number>();
  for (let y = oy0; y <= oy1; y++) {
    const l = linhas[y];
    if (!l) continue;
    for (let x = l.x0 + margem; x <= l.x1 - margem; x++) if (lum(b, x, y) < ESCURO) colunas.add(x);
  }
  const xsOlho = [...colunas].sort((a, c) => a - c);
  if (xsOlho.length === 0) throw new Error("medir: nenhum olho encontrado dentro do rosto");
  const grupos: number[][] = [];
  let g: number[] = [xsOlho[0]];
  for (let i = 1; i < xsOlho.length; i++) {
    if (xsOlho[i] - xsOlho[i - 1] > 8) {
      grupos.push(g);
      g = [];
    }
    g.push(xsOlho[i]);
  }
  grupos.push(g);
  // os dois maiores grupos são os olhos; qualquer sujeira é menor
  const doisMaiores = [...grupos].sort((a, c) => c.length - a.length).slice(0, 2).sort((a, c) => a[0] - c[0]);
  if (doisMaiores.length < 2) throw new Error("medir: achei menos de dois olhos");
  const caixaOlho = (gr: number[]): Caixa => {
    const a = gr[0];
    const c = gr[gr.length - 1];
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let y = oy0; y <= oy1; y++)
      for (let x = a; x <= c; x++)
        if (lum(b, x, y) < ESCURO) {
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    return {
      x0: u(a), x1: u(c), y0: u(y0), y1: u(y1),
      cx: u((a + c) / 2), cy: u((y0 + y1) / 2),
      larg: u(c - a + 1), alt: u(y1 - y0 + 1),
    };
  };
  const olhoE = caixaOlho(doisMaiores[0]);
  const olhoD = caixaOlho(doisMaiores[1]);

  // --- o plano lateral: faixa mais escura que o platô, junto à borda interna ---
  const banda = (y: number, frac: number) => {
    const l = linhas[y];
    if (!l) return { fracAltura: frac, esq: 0, dir: 0 };
    const a = l.x0 + espessura(y, 1) + 1;
    const c = l.x1 - espessura(y, -1) - 1;
    if (c - a < 20) return { fracAltura: frac, esq: 0, dir: 0 };
    const v: number[] = [];
    for (let x = a; x <= c; x++) v.push(lum(b, x, y));
    const ord = [...v].sort((p, q) => p - q);
    const plato = ord[Math.floor(ord.length / 2)];
    // `plato - 8` e não `plato - 2`: o que se procura é um DEGRAU de tom, não o
    // antialiasing do contorno. A referência tem o interior chapado em 221 e o
    // plano lateral em ~189; um corte de 2 pega junto a rampa suave de 3 ou 4
    // níveis que existe nos dois lados e faz a assimetria — que é o sinal —
    // desaparecer no ruído.
    const corte = plato - 8;
    let esq = 0;
    for (let i = 0; i < v.length && v[i] < corte; i++) esq++;
    let dir = 0;
    for (let i = v.length - 1; i >= 0 && v[i] < corte; i--) dir++;
    return { fracAltura: frac, esq: u(esq), dir: u(dir) };
  };
  // Na cabeça as três alturas fogem da banda das orelhas (que fica em ~0,66) e
  // do arremate de baixo; no tronco elas pegam ombro, barriga e base.
  const plano = [0.30, 0.40, 0.50].map((frac) =>
    banda(utilY0 + Math.round((cabecaY1 - utilY0) * frac), frac),
  );
  const planoTronco = [0.25, 0.5, 0.75].map((frac) =>
    banda(yCorte + Math.round((utilY1 - yCorte) * frac), frac),
  );

  // --- AS FACETAS: o rosto como um CUBO, e a aresta achada sem supor o sinal ---
  //
  // `banda()`, acima, pergunta *"quantos pixels seguidos, a partir da borda, estão
  // mais escuros que o platô?"*. A pergunta tem o sinal embutido, e por isso ela
  // mediu ZERO à esquerda na referência e a conclusão foi que não havia faceta
  // esquerda — o defeito que o Doug reprovou como "efeito cubo" faltando.
  //
  // Aqui a pergunta é *"onde está a descontinuidade?"*, e `particao()` responde para
  // qualquer sinal.
  //
  // AS FAIXAS DE LEITURA SÃO ESCOLHIDAS, E ISSO É PARTE DA MEDIDA. Duas coisas
  // dentro do rosto arruínam a partição, e nenhuma das duas é faceta:
  //
  //  - **o especular**, no alto à esquerda (medido: uma faixa de 20 unidades a 32
  //    unidades para DENTRO da borda, em `frac` 0,07–0,22). Quem parte uma linha que
  //    o atravesse acha um segmento claro e o reporta como "faceta esquerda +15".
  //    Ela não é: a faceta encosta na borda, o especular não;
  //  - **os olhos**, em `frac` 0,49–0,76, que são tinta preta e dominam qualquer
  //    partição por erro quadrático.
  //
  // Sobram duas janelas limpas, e são estas. A leitura em três alturas de cada
  // janela é média para tirar o ruído de antialiasing.
  //
  // ---------------------------------------------------------------------------
  // AS JANELAS ANDARAM NO BLOCO 1d, E É A CORREÇÃO MAIS SILENCIOSA DELE
  // ---------------------------------------------------------------------------
  //
  // A arte nova acrescentou duas peças de tinta que não existiam quando estas
  // janelas foram escolhidas: **sobrancelhas** em `fracCab` 0,398–0,438 e **boca**
  // em 0,822–0,844. A janela do topo terminava em 0,40 e a da base começava em
  // 0,84 — as duas encostavam na tinta nova.
  //
  // O modo de falha é o pior que existe: `particao()` acha a descontinuidade da
  // sobrancelha em vez da aresta da faceta, reporta uma largura e um delta
  // plausíveis, e o gate fica **VERDE** porque compara essa leitura errada contra a
  // mesma leitura errada na referência. Um marco que mede outra coisa e concorda
  // consigo mesmo é indistinguível de um marco que funciona.
  //
  // A guarda de `faceta()` — descartar a linha se o platô central cair abaixo de
  // 140 — é a rede, e ela salva só quando a tinta cruza o MEIO do rosto. A
  // sobrancelha não cruza: ela mora sobre o olho, longe do eixo.
  //
  // AS JANELAS NOVAS FORAM ESCOLHIDAS POR VARREDURA, e não por dedução — porque a
  // dedução errou. A primeira tentativa foi subir a janela do topo para 0,26–0,34,
  // já que a sobrancelha começa em 0,398. Medido, isso é pior: em `frac` 0,26 a
  // partição devolve uma "faceta esquerda" de **103 unidades a −2,2** na arte nova
  // e de **132 a +2,6** na antiga. Não é faceta nenhuma, é o ESPECULAR — a faixa
  // clara que começa 32 unidades para dentro da borda, e que este mesmo comentário
  // já avisava para evitar. Fugir de uma tinta caindo na outra.
  //
  // Varrendo a altura da cabeça de 2 em 2 centésimos nas DUAS artes, a banda em que
  // a faceta esquerda lê estável (~32 unidades) vai de 0,28 a 0,48, e a sobrancelha
  // come 0,40–0,42. Sobra 0,28–0,38 no alto.
  //
  // | janela              | nova            | antiga          | leituras |
  // |---------------------|-----------------|-----------------|----------|
  // | [0,30 0,35 0,40]    | 32,7 / −4,1     | 32,1 / −4,8     | 2 de 3   |
  // | [0,26 0,30 0,34]    | **103,2** / −2,2| **131,9** / +2,6| 3 de 3   |
  // | **[0,30 0,34 0,38]**| 32,7 / −4,6     | 32,1 / −4,4     | **3 de 3** |
  //
  // A janela velha ainda "funcionava" por acidente: a guarda do platô descartava a
  // linha da sobrancelha e a média saía de 2 leituras em vez de 3. Depender disso é
  // ter um marco cuja precisão cai sem avisar. Estas três são limpas por construção.
  //
  // Na base o mesmo procedimento: a boca acaba em 0,844 e o contorno começa a fechar
  // por volta de 0,92, alargando a leitura da direita (0,94 devolve 74,9). Sobra
  // 0,86–0,91, e **[0,87 0,89 0,91]** lê 3 de 3 nas duas artes.
  //
  // `FAIXA_FACETA.yAmostraTopo/yAmostraBase` acompanham em `geometria.ts` — 0,34 e
  // 0,89, os centros destas janelas. Elas existem para o gradiente valer o tom
  // medido **na altura em que ele foi medido**, e uma janela que anda sem a âncora
  // reintroduz o defeito que o Bloco 1c consertou.
  const faceta = (y: number) => {
    const l = linhas[y];
    if (!l) return null;
    const a = l.x0 + espessura(y, 1) + 2;
    const c = l.x1 - espessura(y, -1) - 2;
    if (c - a < 40) return null;
    const v: number[] = [];
    for (let x = a; x <= c; x++) v.push(lum(b, x, y));
    const p = particao(v, 3);
    // O segmento do meio é o platô frontal. Se ele estiver escuro, a linha pegou
    // tinta (olho, boca, contorno interno) e a leitura inteira não vale — reportar
    // um número errado é pior que não reportar, e é a mesma decisão já registrada
    // para o especular no `Marcos`.
    if (p.medias[1] < 140) return null;
    return {
      plato: p.medias[1],
      largEsq: u(p.larguras[0]),
      deltaEsq: p.medias[0] - p.medias[1],
      largDir: u(p.larguras[2]),
      deltaDir: p.medias[2] - p.medias[1],
    };
  };
  const janela = (fracs: number[]) => {
    const lidas = fracs
      .map((f) => faceta(utilY0 + Math.round((cabecaY1 - utilY0) * f)))
      .filter((x): x is NonNullable<typeof x> => x !== null);
    if (!lidas.length) return { largEsq: 0, deltaEsq: 0, largDir: 0, deltaDir: 0, plato: 1 };
    const m = (f: (x: (typeof lidas)[0]) => number) =>
      lidas.reduce((s, x) => s + f(x), 0) / lidas.length;
    return {
      largEsq: m((x) => x.largEsq),
      deltaEsq: m((x) => x.deltaEsq),
      largDir: m((x) => x.largDir),
      deltaDir: m((x) => x.deltaDir),
      plato: m((x) => x.plato),
    };
  };
  const facetaTopo = janela([0.30, 0.34, 0.38]);
  const facetaBase = janela([0.87, 0.89, 0.91]);

  // --- O QUEIXO E A SOMBRA ABAIXO DELE: a mesma partição, virada de lado ---
  //
  // As duas são faixas HORIZONTAIS, então a varredura é uma coluna. Elas moram uma
  // de cada lado do contorno que separa a cabeça do tronco, e a de baixo é a mais
  // escura do boneco inteiro — é ela que assenta a cabeça sobre o corpo, e nenhuma
  // das duas existe hoje.
  //
  // `qual` diz em que ponta da janela mora a faixa, e a distinção é obrigatória: o
  // queixo fica no FIM da janela (o platô do rosto vem antes dele, descendo) e a
  // sombra fica no COMEÇO (ela encosta no contorno, e o tom do tronco vem depois).
  // Sem o parâmetro, uma das duas sai com o sinal trocado — a sombra reportava
  // **+45** em vez de −46, e um marco com o sinal errado não reprova o desenho que
  // esqueceu a sombra: reprova o que a desenhou.
  const faixaVertical = (yDe: number, yAte: number, x: number, qual: "inicio" | "fim") => {
    const v: number[] = [];
    for (let y = yDe; y <= yAte; y++) {
      const t = lum(b, x, y);
      if (t < ESCURO) return null; // bateu no contorno: a janela está errada
      v.push(t);
    }
    if (v.length < 8) return null;
    const p = particao(v, 2);
    const i = qual === "fim" ? 1 : 0;
    return {
      altura: u(p.larguras[i]),
      delta: p.medias[i] - p.medias[1 - i],
      plato: p.medias[1 - i],
    };
  };
  const eixoCabecaPx = Math.round((cx0 + cx1) / 2);
  /** Onde o contorno cabeça↔tronco começa e acaba, na coluna do eixo da cabeça. */
  const contorno = naColuna(b, eixoCabecaPx, utilY0, utilY1).filter(
    (c) => c.centro > utilY0 + (cabecaY1 - utilY0) * 0.8,
  );
  const queixo =
    contorno.length &&
    faixaVertical(
      utilY0 + Math.round((cabecaY1 - utilY0) * 0.7),
      Math.round(contorno[0].x0) - 2,
      eixoCabecaPx,
      "fim",
    );
  const sombraQueixo =
    contorno.length &&
    faixaVertical(
      Math.round(contorno[0].x1) + 2,
      Math.min(utilY1, Math.round(contorno[0].x1) + 2 + Math.round(70 / fator)),
      eixoCabecaPx,
      "inicio",
    );

  // A CONTAGEM DE TRAÇOS NA BANDA DAS ORELHAS morava aqui, e saiu no Bloco 1d junto
  // com as orelhas. Ela era o marco que enxergava a orelha esquerda desenhada como
  // peça colada atrás — 2 traços onde a referência tem 1, com a silhueta externa
  // idêntica nos dois casos. A arte nova não tem orelha nenhuma, e um marco que
  // compara 1 contra 1 em toda parte não reprova desenho nenhum.
  //
  // O que ela ensinou continua no arquivo e é o que importa: `corridas()`, `naLinha()`
  // e `naColuna()` existem porque a silhueta externa é cega para o que está DENTRO
  // dela, e essa cegueira custou um bloco inteiro.

  // --- A ESPESSURA DO TRAÇO, corrigida pela inclinação da borda ---
  //
  // Uma varredura horizontal atravessa um traço inclinado na diagonal e mede
  // `t · √(1 + m²)`. Sem a correção, misturar seções oblíquas com retas puxa a média
  // para cima — o erro só tem um sinal. Foi assim que `TRACO` virou 17 quando o
  // traço da referência mede 13.
  const espessuras: number[] = [];
  for (let y = utilY0 + Math.round(alturaUtilPx * 0.1); y < utilY0 + Math.round(alturaUtilPx * 0.9); y++) {
    const aqui = linhas[y];
    const ant = linhas[y - 3];
    const pos = linhas[y + 3];
    if (!aqui || !ant || !pos) continue;
    for (const lado of [1, -1] as const) {
      const borda = (l: Linha) => (lado === 1 ? l.x0 : l.x1);
      const m = (borda(pos) - borda(ant)) / 6;
      if (Math.abs(m) > 1) continue;
      espessuras.push(u(espessura(y, lado)) / Math.sqrt(1 + m * m));
    }
  }
  espessuras.sort((p, q) => p - q);
  const espessuraTraco = espessuras.length ? espessuras[Math.floor(espessuras.length / 2)] : 0;

  // --- a coluna central do rosto: tem de estar no platô, não numa faixa ---
  // As três alturas param antes de 0,398, onde a sobrancelha começa: a coluna do
  // eixo passa entre as duas sobrancelhas, mas a leitura do platô é a mediana da
  // linha inteira, e a tinta puxa a mediana para baixo — o que aparece como uma
  // "queda no eixo" que não existe. Mesmo motivo das janelas das facetas.
  let faixaNoEixo = 0;
  for (const frac of [0.2, 0.26, 0.32]) {
    const y = utilY0 + Math.round((cabecaY1 - utilY0) * frac);
    const l = linhas[y];
    if (!l) continue;
    const a = l.x0 + espessura(y, 1) + 1;
    const c = l.x1 - espessura(y, -1) - 1;
    if (c - a < 20) continue;
    const v: number[] = [];
    for (let x = a; x <= c; x++) v.push(lum(b, x, y));
    const ord = [...v].sort((p, q) => p - q);
    const plato = ord[Math.floor(ord.length / 2)];
    const meio = Math.round((cx0 + cx1) / 2);
    const queda = plato - lum(b, meio, y);
    if (queda > faixaNoEixo) faixaNoEixo = queda;
  }

  // --- a sombra do chão: tinta CLARA, e só abaixo da base do tronco ---
  //
  // O fundo sai do canto da imagem, não de uma constante: a folha, o gate e a
  // referência têm fundos parecidos mas não idênticos, e um limiar absoluto
  // mediria sombras diferentes em cada um.
  const fundo = lum(b, 2, 2);
  let sx0 = Infinity;
  let sx1 = -Infinity;
  let escurecimento = 0;
  const ate = Math.min(b.h - 1, utilY1 + Math.round(alturaUtilPx * 0.12));
  for (let y = utilY1 + 2; y <= ate; y++) {
    for (let x = 0; x < b.w; x++) {
      const queda = fundo - lum(b, x, y);
      if (queda > 4) {
        if (x < sx0) sx0 = x;
        if (x > sx1) sx1 = x;
        if (queda > escurecimento) escurecimento = queda;
      }
    }
  }
  const temSombra = sx1 >= sx0;
  const sombra = {
    larg: temSombra ? u(sx1 - sx0 + 1) : 0,
    desvio: temSombra ? u((sx0 + sx1) / 2) - u((tx0 + tx1) / 2) : 0,
    escurecimento,
  };

  // --- o perfil, marcando as linhas que SALTAM do núcleo da cabeça ---
  //
  // `orelha` era o nome, e o que ele mede é qualquer linha em que a silhueta exceda
  // o núcleo da cabeça em mais de 2 px. Na arte com orelhas ele era verdadeiro em
  // ~30 linhas e o gate as excluía do perfil, porque a saliência dominaria o erro. Na
  // arte nova ele é **falso em toda linha**, nas duas fontes, e o filtro do gate
  // virou um no-op.
  //
  // Ele fica. O campo não descreve orelha, descreve saliência — e é o guarda que
  // impede uma protuberância futura (uma mecha, um coque) de mascarar erro de
  // silhueta na estatística do perfil. Um guarda que hoje não dispara é diferente de
  // um guarda que não existe.
  const eixoTroncoPx = (tx0 + tx1) / 2;
  const perfil = [];
  for (let i = 0; i < AMOSTRAS; i++) {
    const frac = i / (AMOSTRAS - 1);
    const y = Math.min(utilY1, utilY0 + Math.round(frac * (alturaUtilPx - 1)));
    const l = linhas[y];
    const e = l ? cx0 - l.x0 : 0;
    const d = l ? l.x1 - cx1 : 0;
    perfil.push({
      frac,
      larg: l ? u(l.larg) : 0,
      esq: l ? u(eixoTroncoPx - l.x0) : 0,
      dir: l ? u(l.x1 - eixoTroncoPx) : 0,
      orelha: y <= cabecaY1 && (e > 2 || d > 2),
    });
  }

  return {
    fator,
    alturaUtilPx,
    cabeca,
    tronco,
    olhos: {
      esq: olhoE,
      dir: olhoD,
      desvioDoEixo: (olhoE.cx + olhoD.cx) / 2 - cabeca.cx,
      desnivel: olhoE.cy - olhoD.cy,
      separacao: olhoD.cx - olhoE.cx,
    },
    giroDoEixo: cabeca.cx - tronco.cx,
    planoLateral: plano,
    planoLateralTronco: planoTronco,
    facetas: {
      topo: facetaTopo,
      base: facetaBase,
      queixo: queixo || { altura: 0, delta: 0, plato: 1 },
      sombraQueixo: sombraQueixo || { altura: 0, delta: 0, plato: 1 },
    },
    espessuraTraco,
    sombra,
    faixaNoEixo,
    perfil,
  };
}

// ---------------------------------------------------------------------------
// Decimação — o critério que escolhe QUAIS pontos sobrevivem
// ---------------------------------------------------------------------------

export interface OpcoesDecimar {
  /**
   * `true` para curva FECHADA (o contorno do crânio, o perfil do tronco): o primeiro
   * e o último ponto são vizinhos e podem ser removidos como qualquer outro.
   *
   * `false` para curva ABERTA (uma franja, o lado externo de um lóbulo): as duas
   * pontas são ancoradas e nunca saem. Numa franja as pontas são o que o `clipPath`
   * corta — perdê-las encurtaria a peça pela lateral, que é defeito de silhueta e
   * não de suavidade.
   */
  fechado?: boolean;
  /**
   * Distância abaixo da qual dois vizinhos colapsam num só, ANTES do erro de corda.
   * `0` desliga, e é o padrão.
   *
   * Existe para as EMENDAS do contorno do crânio, onde a varredura por linha e a por
   * coluna descrevem o mesmo pedaço de borda e cada uma contribui o seu ponto final.
   * Erro de corda não os remove — dois pontos colados são colineares com quase tudo,
   * então custam pouco pelos dois lados — e uma Catmull-Rom que passa por dois pontos
   * a 3 unidades de distância ganha um laço ali. Distância bruta é o critério certo,
   * e não curvatura.
   *
   * Numa varredura de franja não há emenda, e um colapso de 5 unidades viraria uma
   * reamostragem uniforme por comprimento de arco antes do critério de verdade —
   * exatamente o que o erro de corda existe para não ser. Por isso o padrão é 0.
   */
  colapso?: number;
}

/**
 * Reduz uma poligonal a `alvo` pontos, **pelo erro de corda** e não por passo fixo.
 *
 * Passo fixo gasta pontos onde a curva é reta e falta onde ela vira — e é justamente
 * nas viradas (a cúpula, o queixo, o vão entre duas mechas) que a forma mora. Aqui um
 * ponto só sobrevive se removê-lo afastasse a curva mais que os outros: a cada rodada
 * some o ponto cuja retirada custa menos.
 *
 * ---------------------------------------------------------------------------
 * DUAS ALTERNATIVAS FORAM MEDIDAS CONTRA ELE, E AS DUAS PERDERAM
 * ---------------------------------------------------------------------------
 *
 * O erro de corda é o critério clássico para **aproximar uma poligonal por outra**, e
 * estes pontos não são uma poligonal: são pontos de controle de uma spline. A objeção
 * é legítima e foi testada, medindo no path EMITIDO (amostrado com `getPointAtLength`)
 * o máximo de `|dκ/ds|` e o menor raio de curvatura:
 *
 * | critério | dκ/ds máx | raio mínimo | caixa preservada |
 * |---|---|---|---|
 * | **erro de corda** | 3,6e-3 | **32,6** | sim |
 * | arco uniforme | **2,3e-3** | 31,4 | sim |
 * | densidade ∝ curvatura | 1,2e-2 | 13,8 | **não** — o ápice cai 1,7 u |
 *
 * A densidade por curvatura é a que parecia mais certa no papel e é a pior: ela adensa
 * os cantos e deixa a cúpula — que é gentil e longa — com pontos de menos, e o ápice
 * da cabeça desce quase duas unidades. Arco uniforme empata dentro do ruído.
 *
 * **Mais pontos também não ajudam NO CONTORNO DO CRÂNIO**, e isso é contraintuitivo o
 * bastante para ficar escrito: com 48 pontos o raio mínimo cai para 16,8 e com 88 para
 * 16,4, porque o critério passa a gastar pontos reproduzindo detalhe de amostragem em
 * vez de forma.
 *
 * **Essa lição é do crânio e não se transporta para uma mecha**, e confundir as duas
 * custou uma rodada. O crânio é uma convexa lisa: ali curvatura alta é ruído de
 * amostragem, e gastar ponto nela é gastar ponto em nada. Numa franja os extremos
 * **são** a forma — o que distingue mecha de reta é onde ela sobe e onde ela desce. O
 * `alvo` certo é medido por curva, e não herdado por analogia.
 *
 * O ganho real da rodada do crânio não estava aqui. O "mini kink acima do reflexo da
 * luz" que o Doug viu era o **especular**, que crowdeava o contorno a 1,8 unidade —
 * ver `pathEspecular()` em `geometria.ts`.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE MORA AQUI, E NÃO NO ARQUIVO QUE O USA
 * ---------------------------------------------------------------------------
 *
 * Ele nasceu local a `linha-de-centro.ts`. Quando a régua de cabelo precisou do mesmo
 * critério, copiá-lo teria criado **duas cópias que divergem** — a lição de seis
 * medições do pipeline morto, citada no topo do `cabelo.ts`. O contorno do crânio e a
 * franja de um cabelo têm de ser reduzidos pela mesma régua, ou a comparação entre os
 * dois passa a medir a diferença entre os critérios.
 */
export function decimarPorCorda<T extends { x: number; y: number }>(
  pts: readonly T[],
  alvo: number,
  opc: OpcoesDecimar = {},
): T[] {
  const colapso = opc.colapso ?? 0;
  const v: T[] = [];
  for (const p of pts) {
    const ult = v[v.length - 1];
    if (colapso > 0 && ult && Math.hypot(p.x - ult.x, p.y - ult.y) < colapso) continue;
    v.push(p);
  }

  while (v.length > alvo) {
    const n = v.length;
    // Numa curva ABERTA as pontas não entram no laço. O erro de corda de um extremo
    // seria medido contra os seus dois vizinhos ciclados — e numa curva aberta um
    // deles é o outro extremo, do lado oposto da peça. A conta perde o sentido e a
    // franja encolhe pelas duas beiradas, que é justamente onde o `clipPath` já corta.
    const de = opc.fechado ? 0 : 1;
    const ate = opc.fechado ? n : n - 1;
    if (ate <= de) break;
    let pior = de;
    let menorCusto = Infinity;
    for (let i = de; i < ate; i++) {
      const a = v[(i - 1 + n) % n];
      const p = v[i];
      const c = v[(i + 1) % n];
      const dx = c.x - a.x;
      const dy = c.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const custo = Math.abs(dx * (a.y - p.y) - dy * (a.x - p.x)) / len;
      if (custo < menorCusto) {
        menorCusto = custo;
        pior = i;
      }
    }
    v.splice(pior, 1);
  }
  return v;
}

/**
 * QUANTO A POLIGONAL DECIMADA SE AFASTA DA VARREDURA DENSA — o número que escolhe N.
 *
 * É o par do `decimarPorCorda`: ele decide QUAIS pontos ficam, e este diz QUANTO
 * custou tê-los reduzido. Sem ele, escolher `alvo` é analogia — e analogia foi o que
 * pôs `PONTOS_FINAIS = 10` na régua de cabelo (*"dez pontos são o dobro do que os
 * cinco modelos usam"*), sem uma medição por trás.
 *
 * Mede distância ponto-a-**segmento**, e não ponto-a-ponto: o que a curva reduzida
 * representa entre dois pontos de controle é o segmento entre eles, e comparar com o
 * vértice mais próximo devolveria zero em todo ponto sobrevivente e um número enorme
 * no meio de cada corda.
 *
 * **É uma aproximação por baixo do erro real**, e isso fica declarado: os pontos são
 * de controle de uma Catmull-Rom, que passa por eles mas não segue as cordas. Quem
 * fecha essa lacuna é `.scratch/estilo/fidelidade.ts`, que rasteriza o composto e
 * compara com a arte — este aqui é o número barato, que roda sem chromium e por isso
 * pode varrer N de 8 a 48.
 */
export function desvioDaCorda(
  densa: readonly { x: number; y: number }[],
  reduzida: readonly { x: number; y: number }[],
): { max: number; medio: number } {
  if (reduzida.length < 2 || densa.length === 0) return { max: 0, medio: 0 };
  let max = 0;
  let soma = 0;
  for (const p of densa) {
    let melhor = Infinity;
    for (let i = 0; i < reduzida.length - 1; i++) {
      const a = reduzida[i];
      const b = reduzida[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const l2 = dx * dx + dy * dy;
      const t =
        l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
      melhor = Math.min(melhor, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
    }
    max = Math.max(max, melhor);
    soma += melhor;
  }
  return { max, medio: soma / densa.length };
}
