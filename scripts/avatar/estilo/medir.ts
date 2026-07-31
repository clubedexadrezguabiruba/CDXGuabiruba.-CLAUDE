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
 * regra vale para o SVG que nós emitimos, cujo `stroke` é `LINHA` (#241610,
 * luminância 25). Referência e render medidos pela mesma régua.
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
  orelhas: { esq: number; dir: number; cy: number };
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
  /** Largura por linha, em unidades, indexada pela fração da altura útil. */
  perfil: { frac: number; larg: number; orelha: boolean }[];
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
  const linhas = silhueta(b);
  const ys: number[] = [];
  for (let y = 0; y < b.h; y++) if (linhas[y]) ys.push(y);
  if (ys.length < 20) throw new Error("medir: quase nenhum contorno escuro na imagem");

  const utilY0 = ys[0];
  const utilY1 = ys[ys.length - 1];
  const alturaUtilPx = utilY1 - utilY0 + 1;
  const fator = ALTURA_CANONICA / alturaUtilPx;
  const u = (v: number) => v * fator;

  const L = (y: number) => linhas[y] as Linha;

  // --- o corte cabeça ↔ tronco: a linha mais estreita entre 40% e 78% ---
  let yCorte = utilY0 + Math.round(alturaUtilPx * 0.5);
  let menor = Infinity;
  for (let y = utilY0 + Math.round(alturaUtilPx * 0.4); y <= utilY0 + Math.round(alturaUtilPx * 0.78); y++) {
    const l = linhas[y];
    if (l && l.larg < menor) {
      menor = l.larg;
      yCorte = y;
    }
  }

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

  // --- as orelhas: o que EXCEDE o núcleo da cabeça, cada lado por si ---
  let salEsq = 0;
  let salDir = 0;
  const linhasOrelha: number[] = [];
  for (let y = utilY0; y <= cabecaY1; y++) {
    const l = linhas[y];
    if (!l) continue;
    const e = cx0 - l.x0;
    const d = l.x1 - cx1;
    if (e > salEsq) salEsq = e;
    if (d > salDir) salDir = d;
    if (e > 2 || d > 2) linhasOrelha.push(y);
  }
  const orelhaCy = linhasOrelha.length
    ? (linhasOrelha[0] + linhasOrelha[linhasOrelha.length - 1]) / 2
    : cabeca.cy / fator;

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
  const oy0 = utilY0 + Math.round((cabecaY1 - utilY0) * 0.28);
  const oy1 = utilY0 + Math.round((cabecaY1 - utilY0) * 0.84);
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

  // --- a coluna central do rosto: tem de estar no platô, não numa faixa ---
  let faixaNoEixo = 0;
  for (const frac of [0.2, 0.3, 0.4]) {
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

  // --- o perfil, marcando as linhas de orelha para o gate poder excluí-las ---
  const perfil = [];
  for (let i = 0; i < AMOSTRAS; i++) {
    const frac = i / (AMOSTRAS - 1);
    const y = Math.min(utilY1, utilY0 + Math.round(frac * (alturaUtilPx - 1)));
    const l = linhas[y];
    const e = l ? cx0 - l.x0 : 0;
    const d = l ? l.x1 - cx1 : 0;
    perfil.push({ frac, larg: l ? u(l.larg) : 0, orelha: y <= cabecaY1 && (e > 2 || d > 2) });
  }

  return {
    fator,
    alturaUtilPx,
    cabeca,
    tronco,
    orelhas: { esq: u(salEsq), dir: u(salDir), cy: u(orelhaCy) },
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
    sombra,
    faixaNoEixo,
    perfil,
  };
}
