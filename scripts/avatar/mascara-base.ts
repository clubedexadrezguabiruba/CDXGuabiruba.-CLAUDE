/**
 * As TRÊS máscaras do sistema de vestir, derivadas da base aprovada.
 *
 * O PRINCÍPIO: a silhueta do avatar pertence ao sistema, não à imagem gerada.
 * Todo uniforme é recortado por estas máscaras, então nenhum desenho decide onde
 * termina o ombro. É o que dispensa ajuste manual peça por peça — e o que salvou
 * o uniforme que já existe, sem arte nova.
 *
 * DE ONDE ELAS SAEM, e por isso não há autoria manual: o macacão de treino da
 * base já É a cobertura "manga longa + calça". Ele cobre tronco, braços até o
 * punho e pernas até o tornozelo, e exclui cabeça, mãos e pés — porque é isso que
 * ele veste. As máscaras saem da silhueta dele mais duas folgas medidas.
 *
 * AS TRÊS:
 *
 *  - `cobertura` — o TETO do pano. Macacão + folga de gola + folga de bota,
 *    dilatado, porque roupa é mais larga que corpo. Dilatar aqui é seguro: a
 *    máscara é teto, não piso. Sobra se remove; falta se inventaria.
 *  - `peleFrente` — cabeça, orelhas, pescoço e mãos. O uniforme é recortado para
 *    ter BURACO aqui, e a base aparece por baixo sozinha. É o que dispensa
 *    redesenhar a pele por cima e deixa gola e punho passarem por baixo dela.
 *  - `corpoVestido` — a região que o uniforme substitui, e o limite do fundo de
 *    segurança.
 *
 * AS DUAS MÁSCARAS DE RECORTE NÃO PODEM SER A MESMA. Medido: com uma só, o fundo
 * de segurança escorre para dentro da folga da bota, onde não há pano por cima, e
 * o boneco ganha um bloco verde sob os pés como um pedestal.
 *   - pano  → `cobertura`, folga de bota incluída
 *   - fundo → `corpoVestido`, sem a folga
 */

import { readFileSync } from "fs";
import { deflateSync } from "zlib";
import type { Browser } from "@playwright/test";

/** Bitmap booleano, uma posição por pixel. */
export type Mascara = Uint8Array;

export interface Marcos {
  /** Primeira linha do macacão — o ombro. */
  topoTraje: number;
  /** Última linha do macacão — o tornozelo. */
  tornozelo: number;
  /** Até onde a gola pode subir. */
  yGola: number;
  /** Onde a faixa da bota começa. */
  yBota: number;
}

export interface MascarasBase {
  /** Largura e altura em PIXELS da máscara. */
  w: number;
  h: number;
  /** Unidades do viewBox por pixel. */
  k: number;
  cobertura: Mascara;
  peleFrente: Mascara;
  /**
   * A PELE PRÓPRIA — a camada `av-pele` sozinha, acima da faixa da bota.
   *
   * NÃO é `peleFrente`. `peleFrente` sai da base com as duas camadas de pano
   * escondidas, então inclui o FORRO DE PELE, que se estende por baixo da gola e
   * do punho — e é justamente a costura que custou 2851 px quando as duas
   * máscaras de recorte abriram o mesmo buraco.
   *
   * `peleExposta` é a pele de verdade: a que a base de PRODUÇÃO mostra ali.
   * Medido — `avatar-base-sem-traje.svg` não tem `av-roupa` nem `av-forro-roupa`,
   * as duas foram removidas do arquivo. Então a pergunta "o punho do macacão
   * cobre a mão?" não se aplica à composição real: ali aquele pixel é mão.
   *
   * É o PISO do fundo de segurança. Onde ela está, o fundo chapado do uniforme
   * não pode pintar, porque a resposta certa é a mão e o rosto do boneco.
   *
   * Contida em `peleFrente` POR CONSTRUÇÃO: mesma rasterização, mesmo limiar, um
   * subconjunto estrito de camadas visíveis — esconder camada só clareia pixel.
   */
  peleExposta: Mascara;
  corpoVestido: Mascara;
  /**
   * Os PÉS: a pele abaixo do tornozelo.
   *
   * Fica de fora de `peleFrente` de propósito — o pé vai por BAIXO da bota, não
   * na frente dela. Mas então ele precisa ser OCLUÍDO, senão aparece por baixo da
   * sola: foi o defeito que a folha visual pegou e nenhum gate viu.
   */
  pes: Mascara;
  /**
   * O VÃO ANATÔMICO: entre braço e tronco, e entre as pernas.
   *
   * Ali o resultado certo é o FUNDO DA PÁGINA. Nem uniforme, nem roupa da base,
   * nem forro — é buraco de verdade, e fechá-lo engorda o boneco.
   *
   * Existe porque `cobertura` é dilatada em 40 unidades e essa dilatação FECHA o
   * vão, que é estreito. A dilatação continua sendo teto; o vão é a exclusão
   * explícita que impede o teto de virar piso.
   */
  vaoAnatomico: Mascara;
  marcos: Marcos;
}

/** Canvas da base. Vem do gerador do boneco. */
export const BASE_W = 2556;
export const BASE_H = 3840;
/** Pescoço e sola da base, medidos no alfa do PNG mestre. */
export const Y_PESCOCO = 1554;
export const Y_SOLA = 3530;

/** Folga da roupa sobre o corpo, em unidades do viewBox. */
export const FOLGA = 40;
/** Quanto a bota sobe acima do tornozelo. */
export const BOTA_ACIMA = 240;
/** Quanto a bota passa do pé, em todas as direções. */
export const BOTA_FOLGA = 240;

// ---------------------------------------------------------------------------
// Geometria pura — sem navegador, testável isolada
// ---------------------------------------------------------------------------

export interface Dim {
  w: number;
  h: number;
}

/** Primeira linha com algum pixel aceso. -1 se a máscara está vazia. */
export function primeiraLinha(m: Mascara, { w, h }: Dim): number {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) return y;
  return -1;
}

/** Última linha com algum pixel aceso. -1 se vazia. */
export function ultimaLinha(m: Mascara, { w, h }: Dim): number {
  for (let y = h - 1; y >= 0; y--) for (let x = 0; x < w; x++) if (m[y * w + x]) return y;
  return -1;
}

/**
 * Vãos acesos de uma linha, da esquerda para a direita.
 *
 * Uma linha na altura do braço tem TRÊS vãos — braço, tronco, braço — e não um.
 * Tratá-la como um só foi o que fez a primeira tentativa de deformação esticar o
 * pano por cima do vazio entre o braço e o tronco.
 */
export function vaos(m: Mascara, { w }: Dim, y: number): [number, number][] {
  const out: [number, number][] = [];
  let ini = -1;
  for (let x = 0; x < w; x++) {
    const aceso = m[y * w + x] === 1;
    if (aceso && ini < 0) ini = x;
    if (!aceso && ini >= 0) {
      out.push([ini, x - 1]);
      ini = -1;
    }
  }
  if (ini >= 0) out.push([ini, w - 1]);
  return out;
}

/**
 * Dilatação por distância de Chebyshev — quadrada, e é o que se quer aqui: a
 * folga é isotrópica e a máscara é teto, então canto quadrado não aparece.
 *
 * `so` limita a dilatação a certas linhas; fora delas o pixel é copiado sem
 * crescer. É como a folga da bota fica restrita à faixa do pé.
 */
export function dilatar(m: Mascara, dim: Dim, raioPx: number, so?: (y: number) => boolean): Mascara {
  const { w, h } = dim;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      if (so && !so(y)) {
        out[y * w + x] = 1;
        continue;
      }
      for (let dy = -raioPx; dy <= raioPx; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -raioPx; dx <= raioPx; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < w) out[yy * w + xx] = 1;
        }
      }
    }
  }
  return out;
}

/**
 * O VÃO: o espaço ENTRE corridas acesas, linha a linha.
 *
 * Extraída de `derivarMascaras` para poder ser testada sem navegador. É a
 * geometria que já teve defeito de verdade: a primeira versão declarava o vão
 * por uma FAIXA de altura escolhida a dedo (36% a 62%), e com isso pegou o
 * entalhe do pescoço, enquanto os resíduos reais moravam em y 1400–1560, fora
 * dela.
 *
 * Declarar por TOPOLOGIA resolve sozinho: uma linha na altura do braço tem três
 * corridas — braço, tronco, braço — e o vão é o que fica entre elas. Uma linha de
 * pescoço tem UMA corrida, e por isso não produz vão nenhum, por mais estreita
 * que seja. Nenhum número escolhido a dedo entra aqui.
 */
export function vaoEntreCorridas(silhueta: Mascara, dim: Dim): Mascara {
  const out = new Uint8Array(dim.w * dim.h);
  for (let y = 0; y < dim.h; y++) {
    const corridas = vaos(silhueta, dim, y);
    if (corridas.length < 2) continue;
    for (let c = 0; c + 1 < corridas.length; c++)
      for (let x = corridas[c][1] + 1; x < corridas[c + 1][0]; x++) out[y * dim.w + x] = 1;
  }
  return out;
}

/**
 * Encolhe a máscara em `raioPx`. É o complemento da dilatação do complemento.
 *
 * Serve para usar uma máscara como REGIÃO DE TESTE sem encostar na própria borda:
 * a silhueta da base é limiarizada, então 1 px de discordância na fronteira é
 * inevitável e não é defeito de composição.
 */
export function erodir(m: Mascara, dim: Dim, raioPx: number): Mascara {
  const fora = new Uint8Array(m.length);
  for (let p = 0; p < m.length; p++) fora[p] = m[p] ? 0 : 1;
  const cresceu = dilatar(fora, dim, raioPx);
  const out = new Uint8Array(m.length);
  for (let p = 0; p < m.length; p++) out[p] = m[p] && !cresceu[p] ? 1 : 0;
  return out;
}

/** `a` menos `b`. */
export function subtrair(a: Mascara, b: Mascara): Mascara {
  const out = new Uint8Array(a.length);
  for (let p = 0; p < a.length; p++) out[p] = a[p] && !b[p] ? 1 : 0;
  return out;
}

/** `a` e `b` ao mesmo tempo. */
export function intersecao(a: Mascara, b: Mascara): Mascara {
  const out = new Uint8Array(a.length);
  for (let p = 0; p < a.length; p++) out[p] = a[p] && b[p] ? 1 : 0;
  return out;
}

/** `a` mais `b`. */
export function unir(a: Mascara, b: Mascara): Mascara {
  const out = new Uint8Array(a.length);
  for (let p = 0; p < a.length; p++) out[p] = a[p] || b[p] ? 1 : 0;
  return out;
}

/** Quantos pixels acesos. */
export function area(m: Mascara): number {
  let n = 0;
  for (let p = 0; p < m.length; p++) if (m[p]) n++;
  return n;
}

/** Recorta uma máscara a uma faixa de linhas, inclusive nas duas pontas. */
export function faixa(m: Mascara, dim: Dim, y0: number, y1: number): Mascara {
  const { w, h } = dim;
  const out = new Uint8Array(m.length);
  for (let y = Math.max(0, y0); y <= Math.min(h - 1, y1); y++)
    for (let x = 0; x < w; x++) out[y * w + x] = m[y * w + x];
  return out;
}

// ---------------------------------------------------------------------------
// Derivação — precisa rasterizar a base, então precisa de navegador
// ---------------------------------------------------------------------------

/** Rasteriza a base com um subconjunto de camadas e devolve a silhueta. */
async function silhueta(
  nav: Browser,
  folha: string,
  esconder: string[],
  k: number,
): Promise<{ m: Mascara; w: number; h: number }> {
  const w = Math.round(BASE_W / k);
  const h = Math.round(BASE_H / k);
  const pg = await nav.newPage({ viewport: { width: w, height: h } });
  try {
    const css = esconder.length
      ? `<style>${esconder.map((c) => `.${c}`).join(",")}{display:none}</style>`
      : "";
    // A cor não importa: a silhueta é "o que não é o branco do fundo".
    await pg.setContent(
      `<body style="margin:0">` +
        `<div aria-hidden style="position:absolute;width:0;height:0">${folha}</div>` +
        `<svg width="${w}" height="${h}" viewBox="0 0 ${BASE_W} ${BASE_H}" ` +
        `style="--av-pele:#000;--av-cabelo:#000;background:#fff">${css}` +
        `<use href="#avatar-base-neutro" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/></svg></body>`,
    );
    const buf = await pg.screenshot();
    const bruto = await pg.evaluate(async (b64) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, c.width, c.height).data;
      const m: number[] = [];
      for (let i = 0; i < d.length; i += 4)
        m.push(d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240 ? 0 : 1);
      return { m, w: c.width, h: c.height };
    }, buf.toString("base64"));
    return { m: Uint8Array.from(bruto.m), w: bruto.w, h: bruto.h };
  } finally {
    await pg.close();
  }
}

/**
 * Deriva as três máscaras da base.
 *
 * `k` é a resolução: unidades do viewBox por pixel. 2 dá 1278×1920, que é fino o
 * bastante para o recorte e barato o bastante para dilatar em milissegundos.
 */
export async function derivarMascaras(
  nav: Browser,
  arquivoBase = "public/items/base/avatar-base-neutro.svg",
  k = 2,
): Promise<MascarasBase> {
  const folha = readFileSync(arquivoBase, "utf-8");

  // O macacão sozinho, e a pele sozinha. As classes vêm do gerador da base.
  const traje = await silhueta(nav, folha, ["av-forro-pele", "av-pele", "av-sobrancelha", "av-olho"], k);
  const pele = await silhueta(nav, folha, ["av-forro-roupa", "av-roupa"], k);
  // A PELE PRÓPRIA: como `pele`, mas escondendo TAMBÉM o forro de pele. É a única
  // diferença entre "o corpo nu inteiro" e "a pele que a base de produção mostra".
  const peleSo = await silhueta(nav, folha, ["av-forro-roupa", "av-roupa", "av-forro-pele"], k);
  const dim: Dim = { w: traje.w, h: traje.h };

  const topoTraje = primeiraLinha(traje.m, dim);
  const tornozelo = ultimaLinha(traje.m, dim);
  if (topoTraje < 0 || tornozelo < 0)
    throw new Error(
      "macacão não encontrado na base — as classes av-roupa/av-forro-roupa mudaram?",
    );

  const yGola = Math.round((Y_PESCOCO / k + topoTraje) / 2);
  const yBota = tornozelo - Math.round(BOTA_ACIMA / k);

  // COBERTURA: macacão + gola, dilatado; mais a faixa da bota, com folga própria.
  const comGola = unir(traje.m, faixa(pele.m, dim, yGola, topoTraje - 1));
  const regiaoBota = dilatar(
    faixa(unir(traje.m, pele.m), dim, yBota, dim.h - 1),
    dim,
    Math.round(BOTA_FOLGA / k),
    (y) => y >= yBota,
  );
  const limiteBaixo = Math.round((Y_SOLA + 150) / k);
  const cobertura = unir(
    dilatar(comGola, dim, Math.round(FOLGA / k)),
    faixa(regiaoBota, dim, yBota, limiteBaixo),
  );

  // PELE FRONTAL: pele acima da faixa da bota. O pé fica de fora — vai por baixo.
  const peleFrente = faixa(pele.m, dim, 0, yBota - 1);

  // PELE PRÓPRIA: a mesma faixa, sem o forro. A FAIXA É OBRIGATÓRIA — sem ela a
  // máscara engole os pés, e o pé vai por BAIXO da bota: o fundo pararia de pintar
  // ali e o defeito da pele sob a sola voltaria, com o gate de tolerância zero.
  const peleExposta = faixa(peleSo.m, dim, 0, yBota - 1);

  // DUAS TRAVAS, porque `silhueta` casa a PRIMEIRA ocorrência de cada classe: se a
  // base ganhar um segundo `<g class="av-pele">`, a máscara encolhe em silêncio e
  // o gate que depende dela passa a aprovar tudo.
  const naoContida = area(subtrair(peleExposta, peleFrente));
  if (naoContida > 0)
    throw new Error(
      `peleExposta saiu de peleFrente em ${naoContida} px — as camadas da base mudaram? ` +
        `Ela é um subconjunto por construção: mesma rasterização, uma camada a menos visível.`,
    );
  const invasao = area(intersecao(peleExposta, traje.m));
  if (invasao === 0 || invasao > area(traje.m) * 0.05)
    throw new Error(
      `peleExposta invade corpoVestido em ${invasao} px de ${area(traje.m)} — fora da banda esperada. ` +
        `0 significa que a máscara não casou com a classe; muito significa que ela pegou o corpo inteiro.`,
    );

  // PÉS: a pele do tornozelo para baixo. O macacão da base termina no tornozelo,
  // então tudo que é pele abaixo dali é pé.
  const pes = faixa(pele.m, dim, tornozelo, dim.h - 1);

  // VÃO ANATÔMICO: o buraco entre braço e tronco, e entre as pernas.
  //
  // Sai da silhueta da BASE INTEIRA — pano mais pele. Derivá-lo só do macacão
  // classificava a pele do próprio boneco como vão: medido, 7981 px de `av-pele`
  // dentro de um "vão" que não era vão.
  //
  // E ele se declara pela TOPOLOGIA da linha, sem faixa de altura escolhida a
  // dedo: uma linha na altura do braço tem três corridas acesas — braço, tronco,
  // braço — e o espaço entre corridas é o vão. A primeira versão usava uma faixa
  // de 36% a 62% e pegou o entalhe do pescoço, enquanto os resíduos reais moravam
  // em y 1400–1560, fora dela.
  const silhuetaToda = unir(unir(traje.m, pele.m), pes);
  const vaoAnatomico = vaoEntreCorridas(silhuetaToda, dim);

  return {
    w: dim.w,
    h: dim.h,
    k,
    cobertura,
    peleFrente,
    peleExposta,
    corpoVestido: traje.m,
    pes,
    vaoAnatomico,
    marcos: { topoTraje, tornozelo, yGola, yBota },
  };
}

/**
 * O que um recorte entrega.
 *
 * `oclusao` é OPCIONAL, e a opcionalidade é o ponto: ausente, `composicao` usa a
 * oclusão canônica. É assim que o recorte legado reproduz também a oclusão antiga
 * sem que `recortes` precise mudar de forma.
 */
export interface Recorte {
  pano: Mascara;
  fundo: Mascara;
  oclusao?: Mascara;
}

/**
 * As duas máscaras de RECORTE do asset de uniforme.
 *
 * Separadas de propósito — ver o cabeçalho. Confundi-las põe um pedestal verde
 * sob as botas.
 */
export function recortes(m: MascarasBase): { pano: Mascara; fundo: Mascara } {
  return {
    // O VÃO SAI DOS DOIS RECORTES. A dilatação de 40 unidades da `cobertura`
    // fecha o vão entre braço e tronco, e sem esta subtração a arte pinta por
    // cima dele — o boneco perde o vazado e engorda. Teto continua teto: o vão é
    // exclusão explícita, não um piso disfarçado.
    pano: subtrair(subtrair(m.cobertura, m.peleFrente), m.vaoAnatomico),
    // O FUNDO NÃO SUBTRAI `peleFrente`, e isso custou um defeito.
    //
    // Subtraindo, as DUAS camadas abriam o mesmo buraco, e na costura em que a
    // pele encosta no macacão nenhuma das duas pintava: 2851 px em que a base
    // aparecia crua — bege do macacão na gola, no punho e no vão entre braço e
    // tronco. `corpoVestido` é a silhueta do macacão e já exclui cabeça e mãos,
    // então subtrair a pele dele não protegia rosto nenhum: só abria a costura.
    //
    // Onde a arte cobre, este fundo continua invisível — ele é fundo. Onde a arte
    // falha, agora aparece a cor do pano, que é a resposta certa numa região que
    // por definição é vestida.
    //
    // E DILATADO EM 1 px, que é sangria e não folga. A máscara é 1278×1920,
    // desenhada em 2556×3840 e rasterizada de volta: duas reamostragens deixam
    // colunas de 1 px de largura com alfa abaixo de 128 exatamente na borda.
    // Medido: 66 px no Aspirante e 94 no Soldado, todos com 1 px de largura,
    // 100% encostando na borda, e NAS MESMAS COORDENADAS nas duas peças — prova
    // de que é geometria de máscara, não desenho. O 1 px extra fica sob a arte,
    // que se estende 40 unidades além daqui.
    // O vão sai do fundo EROÍDO em 1 px, e a assimetria é de propósito: a
    // fronteira entre corpo e vão vale ±1 px pela limiarização da silhueta, então
    // o que PREENCHE é generoso em 1 px e o que TESTA é estrito em 1 px. Sem
    // isso, a mesma coluna de 1 px reabria na borda do vão — medida em 40 px,
    // idênticos nas duas peças, o que prova geometria e não desenho.
    // E A PELE PRÓPRIA SAI DO FUNDO — a correção do defeito OPOSTO.
    //
    // Tirar o `− peleFrente` daqui (commit `1403143`) fechou a costura, e criou
    // isto: `corpoVestido` é a silhueta das DUAS camadas de pano, e o forro de
    // pano passa por TRÁS da mão. O fundo então pintava chapado, com a cor do
    // uniforme, sobre a mão e sobre o pescoço — onde a arte tem buraco de
    // propósito e a oclusão não alcança. Medido: 1889 px, o MESMO número nas duas
    // peças, dos quais 557 na gola.
    //
    // `peleExposta`, e não `peleFrente`: a diferença entre as duas é o forro de
    // pele, que passa por baixo da gola e do punho e continua coberto. É o que
    // impede esta subtração de reabrir os 2851 px — e o gate de `av-forro-pele
    // em corpoVestido`, tolerância zero, é quem prova isso a cada execução.
    //
    // SEM DILATAR. Um raio de 1 px aqui comeria 1 px do forro e reabriria a
    // costura num anel — exatamente o que aquele gate proíbe. O raio é decidido
    // por um gate que já existe, não por gosto.
    fundo: subtrair(
      subtrair(
        dilatar(m.corpoVestido, { w: m.w, h: m.h }, 1),
        erodir(m.vaoAnatomico, { w: m.w, h: m.h }, 1),
      ),
      m.peleExposta,
    ),
  };
}

/**
 * O RECORTE ANTIGO, o de `6e3feb6` — o estado anterior ao `1403143`.
 *
 * Existe para uma coisa só: ser a FIXTURE do gate de proveniência. Um gate sem
 * fixture pode ficar cego em silêncio, e essa é literalmente a família de falha
 * desta fase — foi assim que `verify:avatar-assets` passou meses vermelho sem
 * ninguém saber. Guardar um PNG de referência não substitui: o que precisa ser
 * conferido é que o INSTRUMENTO ainda mede, não que uma imagem antiga continua
 * igual a si mesma.
 *
 * O DEFEITO, reproduzido literalmente: as duas máscaras subtraem `peleFrente`,
 * então abrem o MESMO buraco, e na costura em que a pele encosta no macacão
 * nenhuma das duas pinta. Por ali a base aparece crua — bege do macacão na gola,
 * nos punhos e nos vãos. Medido no estado antigo: 2851 px.
 *
 * A oclusão do pé vem junto, e sem a subtração do vão, porque era assim: essa
 * subtração só chegou no `3745c4f`. Reproduzir metade do estado antigo não
 * reproduz o estado antigo.
 *
 * NÃO USAR EM PRODUÇÃO. O caminho canônico é `recortes`.
 */
export function recortesLegado(m: MascarasBase): Recorte {
  return {
    pano: subtrair(m.cobertura, m.peleFrente),
    fundo: subtrair(m.corpoVestido, m.peleFrente),
    oclusao: intersecao(dilatar(m.pes, { w: m.w, h: m.h }, 2), m.cobertura),
  };
}

// ---------------------------------------------------------------------------
// Closes derivados — recortes de conferência que saem de medição, não do olho
// ---------------------------------------------------------------------------

/** Caixa envolvente da máscara dentro de uma faixa de linhas. `null` se vazia. */
export function caixaEm(
  m: Mascara,
  { w, h }: Dim,
  y0 = 0,
  y1 = h - 1,
): [number, number, number, number] | null {
  let x0 = w, yy0 = h, x1 = -1, yy1 = -1;
  for (let y = Math.max(0, y0); y <= Math.min(h - 1, y1); y++)
    for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < yy0) yy0 = y;
      if (y > yy1) yy1 = y;
    }
  return x1 < 0 ? null : [x0, yy0, x1, yy1];
}

/** Componentes conectados por 4-vizinhos, maior primeiro. */
export function componentes(
  m: Mascara,
  { w, h }: Dim,
): { px: number; bb: [number, number, number, number] }[] {
  const visto = new Uint8Array(w * h);
  const fila = new Int32Array(w * h);
  const out: { px: number; bb: [number, number, number, number] }[] = [];
  for (let p0 = 0; p0 < w * h; p0++) {
    if (visto[p0] || !m[p0]) continue;
    let ini = 0, fim = 0;
    fila[fim++] = p0;
    visto[p0] = 1;
    let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    while (ini < fim) {
      const p = fila[ini++];
      const x = p % w, y = (p / w) | 0;
      n++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      const viz = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of viz) if (q >= 0 && !visto[q] && m[q]) { visto[q] = 1; fila[fim++] = q; }
    }
    out.push({ px: n, bb: [x0, y0, x1, y1] });
  }
  return out.sort((a, b) => b.px - a.px);
}

/** A linha com a MAIOR CORRIDA contígua acesa, e essa corrida. */
export function linhaDaMaiorCorrida(
  m: Mascara,
  dim: Dim,
  y0 = 0,
  y1 = dim.h - 1,
): { y: number; ini: number; fim: number } | null {
  let melhor: { y: number; ini: number; fim: number } | null = null;
  for (let y = Math.max(0, y0); y <= Math.min(dim.h - 1, y1); y++)
    for (const [ini, fim] of vaos(m, dim, y))
      if (!melhor || fim - ini > melhor.fim - melhor.ini) melhor = { y, ini, fim };
  return melhor;
}

/** Um recorte de conferência, com a medição que o produziu. */
export interface Close {
  rotulo: string;
  /** `viewBox` em unidades do canvas da base. */
  vb: string;
  /** De onde a caixa saiu. Vai impressa na folha, ao lado da figura. */
  origem: string;
}

/**
 * OS QUATRO CLOSES, DERIVADOS DAS MÁSCARAS.
 *
 * Eram literais — `"950 1420 700 700"` e mais três. Um recorte escolhido a olho
 * produziu um antes/depois idêntico e uma conclusão errada nesta fase: a caixa
 * simplesmente não continha o defeito, e "não mudou nada" virou "está consertado".
 *
 * Aqui nenhum número é escrito à mão. Cada caixa sai de um marco ou de uma
 * medição sobre as máscaras, e acompanha o texto do que a produziu — para a folha
 * poder ser conferida sem ler este arquivo.
 *
 * A MARGEM é a única escolha de enquadramento, e é relativa ao tamanho da própria
 * região: ela decide o quanto de contexto entra em volta, nunca ONDE a caixa está.
 */
export function closes(m: MascarasBase): Close[] {
  const dim: Dim = { w: m.w, h: m.h };
  const corpo = caixaEm(m.corpoVestido, dim);
  if (!corpo) return [];
  const [cx0, , cx1] = corpo;
  const largura = cx1 - cx0;

  /**
   * NO EIXO ou LADEANDO — o terço central do corpo decide, e é o que separa as
   * regiões sem nenhum pixel escrito à mão:
   *
   *   vão entre as PERNAS    x=657   no eixo (eixo do corpo = 656)
   *   vão de braço esq/dir   460/856  ladeando
   *   gola                   x=661   no eixo
   *   punho esq/dir          412/906  ladeando
   *
   * A separação medida é de ~196 px contra 1 px, então qualquer corte razoável
   * dentro do terço funciona — não é um limiar em cima do fio da navalha.
   */
  const noEixo = (bb: [number, number, number, number]) => {
    const cx = (bb[0] + bb[2]) / 2;
    return cx > cx0 + largura / 3 && cx < cx1 - largura / 3;
  };

  /** Caixa quadrada de canvas em volta de uma caixa de máscara. */
  const vbDe = (bb: [number, number, number, number], margem = 0.25): string => {
    const [x0, y0, x1, y1] = bb;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const lado = Math.max(x1 - x0, y1 - y0) * (1 + 2 * margem);
    const l = Math.round(lado * m.k);
    return `${Math.round((cx - lado / 2) * m.k)} ${Math.round((cy - lado / 2) * m.k)} ${l} ${l}`;
  };

  const out: Close[] = [];
  const costura = componentes(intersecao(m.corpoVestido, m.peleFrente), dim);

  // GOLA — o maior pedaço de costura NO EIXO. É onde o pescoço encontra o macacão.
  const gola = costura.find((c) => noEixo(c.bb));
  if (gola)
    out.push({
      rotulo: "gola",
      vb: vbDe(gola.bb),
      origem: `costura no eixo, ${gola.px} px, y ${gola.bb[1]}–${gola.bb[3]}`,
    });

  // PUNHO — o maior pedaço de costura LADEANDO. É onde a mão sai da manga. Sem a
  // separação por eixo, a "maior corrida" caía na gola: 49 px em y=836, que é
  // pescoço, e o close do punho mostrava o queixo.
  const punho = costura.find((c) => !noEixo(c.bb));
  if (punho)
    out.push({
      rotulo: "punho",
      vb: vbDe(punho.bb),
      origem: `costura ladeando, ${punho.px} px, y ${punho.bb[1]}–${punho.bb[3]}`,
    });

  // OS DOIS VÃOS QUE LADEIAM O TRONCO — e não o de entre as pernas, que tem 47453
  // px, quase dez vezes cada um deles, e engoliria o boneco inteiro no close.
  const vaos = componentes(m.vaoAnatomico, dim).filter((c) => !noEixo(c.bb));
  const eixoX = (cx0 + cx1) / 2;
  for (const [rotulo, deste] of [
    ["vão esquerdo", (cx: number) => cx < eixoX],
    ["vão direito", (cx: number) => cx > eixoX],
  ] as [string, (cx: number) => boolean][]) {
    const c = vaos.find((k) => deste((k.bb[0] + k.bb[2]) / 2));
    if (c) out.push({ rotulo, vb: vbDe(c.bb), origem: `componente de vaoAnatomico, ${c.px} px` });
  }

  // NÃO HÁ CLOSE SEPARADO DE "MÃO", e isto foi medido, não suposto.
  //
  // A ideia era que o close do punho enquadrasse a COSTURA (o forro sob a manga)
  // e um close novo enquadrasse a MÃO, já que depois da correção do
  // fundo-sobre-a-mão as duas regiões têm vereditos opostos. Só que
  // `corpoVestido ∩ peleExposta` devolve ali o MESMO componente de 216 px em
  // y 1207–1227 que `corpoVestido ∩ peleFrente`: no punho a costura já é pele
  // própria, não forro. As duas caixas saíam idênticas — `1704 2326 216 216` — e
  // a folha ganhava uma linha que repetia a de cima.
  //
  // Onde as duas de fato divergem é na GOLA, e o close da gola já cobre isso.

  // BOTA — UM pé, com a bota por cima dele. A caixa sai do componente do pé e
  // sobe até `yBota`: o defeito daqui foi a pele aparecendo por baixo da sola, e
  // ele mora abaixo do fim do macacão.
  const pe = componentes(m.pes, dim)[0];
  if (pe)
    out.push({
      rotulo: "bota e sola",
      vb: vbDe([pe.bb[0], Math.min(m.marcos.yBota, pe.bb[1]), pe.bb[2], pe.bb[3]], 0.15),
      origem: `pé de ${pe.px} px, de yBota ${m.marcos.yBota} à sola ${pe.bb[3]}`,
    });

  return out;
}

/**
 * O RECORTE de `1403143` — o fundo chapado por cima da mão.
 *
 * A segunda FIXTURE do gate de proveniência, e o par de `recortesLegado`. Aquela
 * reproduz a base vazando para CIMA; esta reproduz o asset cobrindo o que não
 * devia. São defeitos opostos, e cada uma é o controle negativo da outra: junto,
 * elas provam que a correção não trocou um pelo outro — que é literalmente o que
 * o `1403143` fez.
 *
 * O DEFEITO, reproduzido literalmente: o fundo sai de `corpoVestido` sem subtrair
 * pele nenhuma. Como `corpoVestido` é a silhueta das DUAS camadas de pano, e o
 * forro de pano passa por TRÁS da mão, o fundo pinta chapado sobre a mão e sobre
 * o pescoço — onde a arte tem buraco de propósito e a oclusão não alcança.
 * Medido no estado antigo: 1889 px, o MESMO número nas duas peças, dos quais 557
 * na gola.
 *
 * NÃO USAR EM PRODUÇÃO. O caminho canônico é `recortes`.
 */
export function recortesFundoNaMao(m: MascarasBase): Recorte {
  const dim = { w: m.w, h: m.h };
  return {
    pano: subtrair(subtrair(m.cobertura, m.peleFrente), m.vaoAnatomico),
    fundo: subtrair(dilatar(m.corpoVestido, dim, 1), erodir(m.vaoAnatomico, dim, 1)),
  };
}

/** Máscara para PNG de alfa: branco onde acesa, transparente onde não. */
export function paraPngAlfa(m: Mascara, dim: Dim): Buffer {
  // PNG mínimo em escala de cinza com alfa seria mais compacto, mas o consumidor
  // é o `<mask>` do SVG, que lê alfa. Gerar aqui evita depender de biblioteca.
  const { w, h } = dim;
  const linhas: Buffer[] = [];
  for (let y = 0; y < h; y++) {
    const linha = Buffer.alloc(1 + w * 2);
    for (let x = 0; x < w; x++) {
      const on = m[y * w + x] === 1;
      linha[1 + x * 2] = 255;
      linha[1 + x * 2 + 1] = on ? 255 : 0;
    }
    linhas.push(linha);
  }
  return pngCinzaAlfa(Buffer.concat(linhas), w, h);
}

/** PNG cinza+alfa, 8 bits, sem filtro. Escrito à mão para não trazer dependência. */
function pngCinzaAlfa(dados: Buffer, w: number, h: number): Buffer {
  const crcTab: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTab[n] = c >>> 0;
  }
  const crc = (b: Buffer) => {
    let c = 0xffffffff;
    for (const x of b) c = crcTab[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const bloco = (tipo: string, corpo: Buffer) => {
    const t = Buffer.from(tipo, "ascii");
    const tam = Buffer.alloc(4);
    tam.writeUInt32BE(corpo.length);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(Buffer.concat([t, corpo])));
    return Buffer.concat([tam, t, corpo, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bits
  ihdr[9] = 4; // cinza + alfa
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco("IHDR", ihdr),
    bloco("IDAT", deflateSync(dados, { level: 9 })),
    bloco("IEND", Buffer.alloc(0)),
  ]);
}
