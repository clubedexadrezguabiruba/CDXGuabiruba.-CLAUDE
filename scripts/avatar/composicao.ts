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

import { BASE_H, BASE_W, dilatar, intersecao, paraPngAlfa, recortes, subtrair, type MascarasBase } from "./mascara-base";
import { corBota, registro, type Uniforme } from "./uniforme";

/** A solda que fecha fresta de antialiasing entre formas vizinhas do traço. */
const SOLDA = `stroke-width="1.6" stroke-linejoin="round"`;

const b64png = (buf: Buffer) => "data:image/png;base64," + buf.toString("base64");

/** Cores sentinela das camadas do UNIFORME. As da base vivem em `baseSentinela`. */
export const SENTINELA = {
  /** fundo de segurança do uniforme */
  fundo: "#FFFF00",
  /** oclusão do pé sob a bota */
  oclusao: "#FF8000",
  /** arte real do uniforme */
  arte: "#0000FF",
} as const;

/**
 * A composição vetorial, pronta para rasterizar em qualquer tamanho.
 *
 * Com `sentinela`, cada camada sai chapada na sua cor de prova — mesma
 * geometria, mesmas máscaras, mesma ordem. Só a tinta muda.
 */
export function composicao(u: Uniforme, m: MascarasBase, sentinela = false): string {
  const { pano, fundo } = recortes(m);
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
  const oclusaoPe = subtrair(intersecao(dilatar(m.pes, { w: m.w, h: m.h }, 2), m.cobertura), m.vaoAnatomico);
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
