/**
 * CORES SENTINELA — o que transforma "acho que é o macacão" em prova.
 *
 * Cada camada da base é repintada com uma cor impossível de confundir, por
 * SUBSTITUIÇÃO NO TEXTO do SVG. Não por CSS, e a razão é o defeito que este
 * módulo existe para provar: **regra de CSS não alcança o conteúdo de `<use>`**.
 * Medido — a mesma regra que apaga um elemento inline não muda um único byte do
 * conteúdo referenciado.
 *
 * As cores são os seis vértices e arestas do cubo RGB mais distantes entre si,
 * todas saturadas ao máximo: nenhuma sombra, nenhum antialiasing e nenhuma cor
 * da arte cai perto delas por acidente.
 */

/** Cor de prova de cada camada da BASE. As do uniforme vivem em `composicao.ts`. */
export const SENTINELA_BASE = {
  "av-roupa": "#FF0000",
  "av-forro-roupa": "#80FF00",
  "av-forro-pele": "#00FFFF",
  "av-pele": "#FF00FF",
} as const;

export type CamadaBase = keyof typeof SENTINELA_BASE;

/**
 * Onde um `<g class="x">` começa e termina, contando aninhamento.
 *
 * `indexOf("</g>")` sozinho pararia no primeiro fechamento interno: a camada
 * `av-pele` tem seis grupos de sombra dentro dela.
 */
function fatiaGrupo(svg: string, ini: number): [number, number] {
  let prof = 0;
  let j = ini;
  while (j < svg.length) {
    const a = svg.indexOf("<g", j);
    const b = svg.indexOf("</g>", j);
    if (b < 0) break;
    if (a >= 0 && a < b) {
      prof++;
      j = a + 2;
    } else {
      prof--;
      j = b + 4;
      if (prof === 0) return [ini, j];
    }
  }
  throw new Error(`grupo sem fechamento a partir de ${ini}`);
}

/**
 * Repinta um trecho de SVG com uma cor chapada e opaca.
 *
 * A opacidade é removida de propósito: um grupo de sombra a 5,7% misturaria a
 * sentinela com o que está por baixo, e a prova precisa de igualdade exata, não
 * de "parecido com vermelho".
 */
function repintar(trecho: string, cor: string): string {
  return trecho
    .replace(/fill="[^"]*"/g, `fill="${cor}"`)
    .replace(/stroke="[^"]*"/g, `stroke="${cor}"`)
    .replace(/\sopacity="[^"]*"/g, "")
    .replace(/\sfill-opacity="[^"]*"/g, "");
}

/**
 * A base com cada camada na sua cor de prova.
 *
 * `av-olho` e `av-sobrancelha` ficam como estão: são escuras, pequenas e moram
 * na cabeça, longe da região em questão, e repintá-las só criaria ruído.
 */
export function baseSentinela(svg: string): string {
  let saida = svg;
  for (const [classe, cor] of Object.entries(SENTINELA_BASE)) {
    const i = saida.indexOf(`class="${classe}"`);
    // AUSENTE É VÁLIDO: a base sem traje não tem as camadas de roupa, e é
    // exatamente essa ausência que o gate está provando.
    if (i < 0) continue;
    const ini = saida.lastIndexOf("<", i);
    const abre = saida.slice(ini, saida.indexOf(">", i) + 1);
    const [a, b] = abre.startsWith("<g") ? fatiaGrupo(saida, ini) : [ini, saida.indexOf(">", i) + 1];
    saida = saida.slice(0, a) + repintar(saida.slice(a, b), cor) + saida.slice(b);
  }
  return saida;
}

/**
 * A base SEM TRAJE, de verdade: as camadas de roupa são REMOVIDAS do arquivo.
 *
 * É a correção estrutural do defeito. A pilha de runtime escondia o macacão com
 * `.vestido .av-roupa{display:none}`, e essa regra **nunca funcionou**: o
 * conteúdo de `<use>` mora numa árvore-sombra que o seletor do documento não
 * atravessa. O macacão continuava desenhado por baixo do uniforme e aparecia em
 * todo vão que a arte não cobre — o vão entre braço e tronco, na altura do cinto.
 *
 * Ausência estrutural é conferível: dá para procurar `av-roupa` no arquivo e não
 * achar. Ausência por CSS depende de o navegador concordar, e ele não concordava.
 */
export function baseSemTraje(svg: string, novoId = "avatar-base-sem-traje"): string {
  let saida = svg;
  for (const classe of ["av-roupa", "av-forro-roupa"] as const) {
    const i = saida.indexOf(`class="${classe}"`);
    if (i < 0) throw new Error(`camada ${classe} não existe na base`);
    const ini = saida.lastIndexOf("<", i);
    const abre = saida.slice(ini, saida.indexOf(">", i) + 1);
    const [a, b] = abre.startsWith("<g") ? fatiaGrupo(saida, ini) : [ini, saida.indexOf(">", i) + 1];
    saida = saida.slice(0, a) + saida.slice(b);
  }
  return saida.replace(/id="avatar-base-neutro"/, `id="${novoId}"`);
}
