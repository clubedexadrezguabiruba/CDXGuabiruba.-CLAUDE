/**
 * A COMPOSIÇÃO do uniforme — as três camadas assadas, num lugar só.
 *
 * Estava dentro do CLI (`gerar-uniforme.ts`), que roda `main()` ao ser
 * importado, então nenhum gate conseguia usá-la. O gate de proveniência precisa
 * renderizar **a composição real**, não uma cópia parecida: uma cópia prova o
 * comportamento da cópia. Por isso ela mora aqui.
 *
 * O parâmetro `sentinela` troca cada camada por uma cor impossível de confundir,
 * e é o que transforma "acho que esse pixel claro é o macacão da base" em prova.
 */

import {
  BASE_H,
  BASE_W,
  dilatar,
  intersecao,
  paraPngAlfa,
  recortes,
  subtrair,
  type MascarasBase,
  type Recorte,
} from "./mascara-base";
import { corBota, registro, type Uniforme } from "./uniforme";

/** A solda que fecha fresta de antialiasing entre formas vizinhas do traço. */
const SOLDA = `stroke-width="1.6" stroke-linejoin="round"`;

/**
 * EXPORTADA porque `gerar-uniforme.ts` a chama em dois pontos e ela ficou para
 * trás quando a composição mudou de arquivo. O `avatar:garment` morria com
 * `b64png is not defined` DEPOIS de imprimir os nove gates verdes — o veredito
 * nunca saía, e a saída era 1 sem que nenhuma violação tivesse sido encontrada.
 */
export const b64png = (buf: Buffer) => "data:image/png;base64," + buf.toString("base64");

/** Cores sentinela das camadas do UNIFORME. As da base vivem em `baseSentinela`. */
export const SENTINELA = {
  /** fundo de segurança do uniforme */
  fundo: "#FFFF00",
  /** oclusão do pé sob a bota */
  oclusao: "#FF8000",
  /** arte real do uniforme */
  arte: "#0000FF",
} as const;

/** O que dá para trocar na composição. Sem opções, é o caminho de produção. */
export interface OpcoesComposicao {
  /** Troca cada camada pela sua cor de prova. */
  sentinela?: boolean;
  /**
   * Qual recorte usar. Existe para o gate poder montar a FIXTURE: a mesma
   * composição, a mesma arte, o mesmo tudo — só com a geometria de `6e3feb6`,
   * que vaza. Default: o canônico, então o caminho de produção não muda.
   */
  recortes?: (m: MascarasBase) => Recorte;
}

/**
 * A composição vetorial, pronta para rasterizar em qualquer tamanho.
 *
 * Com `sentinela`, cada camada sai chapada na sua cor de prova — mesma
 * geometria, mesmas máscaras, mesma ordem. Só a tinta muda.
 */
export function composicao(u: Uniforme, m: MascarasBase, op: OpcoesComposicao = {}): string {
  const sentinela = op.sentinela ?? false;
  // O tipo é EXPLÍCITO de propósito. Sem ele, o `??` infere a união dos dois
  // tipos de função, e o retorno vira `Recorte | { pano; fundo }` — em que
  // `oclusao` não existe. Rodava certo (em runtime dá `undefined`, e o `??`
  // abaixo faz o certo), mas o tipo estava errado, e nem os 219 testes nem os
  // dois gates viram. Quem viu foi o `tsconfig.scripts.json`.
  const recorta: (m: MascarasBase) => Recorte = op.recortes ?? recortes;
  const { pano, fundo, oclusao } = recorta(m);
  const dim = { w: m.w, h: m.h };
  const mask = (id: string, href: string) =>
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${BASE_W}" height="${BASE_H}" style="mask-type:alpha">` +
    `<image href="${href}" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/></mask>`;
  // OCLUSÃO DO PÉ: a máscara do pé dentro do envelope permitido da bota.
  //
  // Sem ela a pele do pé aparece por baixo da sola, porque o asset fica
  // transparente ali — medido, 2696 px. E a correção NÃO é preencher a folga da
  // bota com a cor média do uniforme: isso recria o pedestal verde. A cor vem da
  // própria bota, e esta camada fica ATRÁS da arte, então só aparece onde a bota
  // não cobre.
  // Dilatada em 2 px antes de intersectar: sem isso sobram 2 px de antialiasing
  // na borda da máscara, e o gate é de tolerância zero. A dilatação fica presa
  // dentro do envelope da bota pela interseção, então não vira orla escura.
  // E SUBTRAI O VÃO: a dilatação de 2 px vaza para o vazio entre as pernas —
  // medido, 466 px de oclusão pintando onde tem de aparecer o fundo da página.
  // Quando o recorte traz a sua própria oclusão, ela manda: é o que deixa a
  // fixture reproduzir o estado antigo INTEIRO, oclusão inclusive.
  const oclusaoPe =
    oclusao ?? subtrair(intersecao(dilatar(m.pes, { w: m.w, h: m.h }, 2), m.cobertura), m.vaoAnatomico);
  const corFundo = sentinela ? SENTINELA.fundo : u.corFundo;
  const corOclusao = sentinela ? SENTINELA.oclusao : corBota(u);
  return (
    `<defs>${mask("mp", b64png(paraPngAlfa(pano, dim)))}${mask("mf", b64png(paraPngAlfa(fundo, dim)))}` +
    `${mask("mo", b64png(paraPngAlfa(oclusaoPe, dim)))}</defs>` +
    // FUNDO primeiro, limitado ao corpo vestido. Ver a armadilha 1.
    `<g mask="url(#mf)"><rect x="0" y="0" width="${BASE_W}" height="${BASE_H}" fill="${corFundo}"/></g>` +
    `<g mask="url(#mo)"><rect x="0" y="0" width="${BASE_W}" height="${BASE_H}" fill="${corOclusao}"/></g>` +
    `<g mask="url(#mp)"><g transform="${registro(u).transform}">` +
    u.pano
      .map((p) => {
        const c = sentinela ? SENTINELA.arte : p.fill;
        return `<path fill="${c}" stroke="${c}" ${SOLDA} d="${p.d}"/>`;
      })
      .join("") +
    `</g></g>`
  );
}
