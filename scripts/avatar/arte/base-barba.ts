/**
 * P0-B — A BASE DE EDIÇÃO DA BARBA: onde ela pode ser desenhada, e onde não.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE DIAGNÓSTICO EXISTE, E O QUE ELE IMPEDE
 * ---------------------------------------------------------------------------
 *
 * A barba é a primeira peça a ser desenhada **na cara do boneco**, e ali mora uma
 * armadilha que nenhuma régua acusa depois: `mascaraDaPeca` roda com
 * `limitar = true` na extração, e isso **zera** todo pixel de peça que cair na
 * região `rosto` (`extrair.ts:366`). Ciano pintado sobre os olhos ou sobre a boca
 * não vira peça — ele desaparece, e a barba chega ao literal amputada.
 *
 * O descarte sai contado no relatório (`fora da região permitida`), mas isso é
 * tarde: o Doug já desenhou. Este programa é o aviso na hora certa — ele pinta a
 * zona proibida sobre a base para o olho ver antes da caneta.
 *
 * É o mesmo papel que `base-tronco-campo.png` faz para o traje, e a assimetria com
 * ele é o ponto: no traje o campo é onde a peça PODE estar; aqui o que importa é o
 * contrário, porque a peça é livre em quase todo lugar e proibida num retângulo
 * pequeno e caro.
 *
 * ---------------------------------------------------------------------------
 * ELE NÃO REESCREVE A BASE, E ISSO É AMARRA
 * ---------------------------------------------------------------------------
 *
 * `arte:base` regeraria `base-oficial.png` de caminho, e esse arquivo é a régua
 * contra a qual o Gate −1 compara TODA arte já aprovada. Um Chromium de versão
 * diferente muda bytes sem mudar desenho, e a rota inteira passaria a medir contra
 * um boneco novo. Então este programa só **lê** a base e escreve um arquivo
 * separado, com nome próprio.
 *
 * O que ele escreve é diagnóstico e **não sobe ao gerador**: qualquer marca aqui
 * seria copiada pelo Gemini para dentro da arte.
 *
 * ---------------------------------------------------------------------------
 * A REGIÃO PROIBIDA NÃO É REDESENHADA AQUI
 * ---------------------------------------------------------------------------
 *
 * As caixas saem de `ROSTO` e `SOBRANCELHAS` (`base.ts`), que são as mesmas
 * constantes que a extração lê. Uma segunda descrição delas concordaria com a
 * intenção em vez de concordar com o código — é a lição que `base-oficial.ts:90-95`
 * já registra, e o motivo de o corpo lá ser varrido pelo predicado `noCorpo` em vez
 * de por uma cópia do contorno.
 */

import { readFileSync, writeFileSync } from "fs";

import sharp from "sharp";

import { BOCA, CAIXA_CABECA, OLHO, TRACO } from "../../../src/lib/avatar/estilo/geometria";
import { LADO, PASTA, PNG_BASE, ROSTO, SOBRANCELHAS, Y_QUEIXO, paraPx } from "./base";

const SAIDA = `${PASTA}/base-barba-campo.png`;

/** Uma caixa em unidades, desenhada em pixels do canvas. */
function caixa(
  c: { x0: number; y0: number; x1: number; y1: number },
  cor: string,
  rotulo: string,
): string {
  const a = paraPx(c.x0, c.y0);
  const b = paraPx(c.x1, c.y1);
  return (
    `<rect x="${a.x.toFixed(1)}" y="${a.y.toFixed(1)}" ` +
    `width="${(b.x - a.x).toFixed(1)}" height="${(b.y - a.y).toFixed(1)}" ` +
    `fill="${cor}" fill-opacity="0.42" stroke="${cor}" stroke-width="3"/>` +
    `<text x="${a.x.toFixed(1)}" y="${(a.y - 8).toFixed(1)}" font-family="sans-serif" ` +
    `font-size="20" font-weight="bold" fill="${cor}">${rotulo}</text>`
  );
}

/** Uma linha horizontal de borda a borda, com rótulo à direita. */
function linha(yUnidade: number, cor: string, rotulo: string): string {
  const y = paraPx(0, yUnidade).y;
  return (
    `<line x1="0" y1="${y.toFixed(1)}" x2="${LADO}" y2="${y.toFixed(1)}" ` +
    `stroke="${cor}" stroke-width="3" stroke-dasharray="14 10"/>` +
    `<text x="${LADO - 12}" y="${(y - 10).toFixed(1)}" text-anchor="end" ` +
    `font-family="sans-serif" font-size="20" font-weight="bold" fill="${cor}">${rotulo}</text>`
  );
}

async function principal(): Promise<void> {
  const base = readFileSync(PNG_BASE);
  const meta = await sharp(base).metadata();
  if (meta.width !== LADO || meta.height !== LADO) {
    throw new Error(
      `a base tem ${meta.width}×${meta.height} e a rota inteira pressupõe ${LADO}×${LADO}. ` +
        `Rode \`npm run arte:base\` de propósito e re-congele os gates antes de seguir.`,
    );
  }

  const overlay =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}">` +
    // A zona proibida: é ela que a extração zera em silêncio.
    caixa(ROSTO, "#D92B2B", "PROIBIDO — a extração descarta ciano daqui") +
    // A sobrancelha só relata, mas uma barba não tem o que fazer aí de qualquer jeito.
    caixa(SOBRANCELHAS, "#D9A02B", "sobrancelha — relata") +
    // Abaixo do queixo a peça é LIVRE: o Bloco 12 tirou o tronco da extração, então
    // barba que cai sobre o peito é peça, não descarte.
    linha(Y_QUEIXO, "#2B8C3A", "queixo — daqui para baixo a barba é livre, inclusive sobre o corpo") +
    `</svg>`;

  const png = await sharp(base)
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .png()
    .toBuffer();
  writeFileSync(SAIDA, png);

  // ------------------------------------------------------------- os números
  const a = paraPx(ROSTO.x0, ROSTO.y0);
  const b = paraPx(ROSTO.x1, ROSTO.y1);
  console.log(`P0-B — O CAMPO DA BARBA\n`);
  console.log(`  A ZONA PROIBIDA — olhos e boca, com meio traço de folga`);
  console.log(
    `    em unidades         x ${ROSTO.x0.toFixed(1)}→${ROSTO.x1.toFixed(1)}  ` +
      `y ${ROSTO.y0.toFixed(1)}→${ROSTO.y1.toFixed(1)}   ` +
      `(${(ROSTO.x1 - ROSTO.x0).toFixed(1)} × ${(ROSTO.y1 - ROSTO.y0).toFixed(1)} u)`,
  );
  console.log(
    `    em pixels do canvas x ${a.x.toFixed(0)}→${b.x.toFixed(0)}  ` +
      `y ${a.y.toFixed(0)}→${b.y.toFixed(0)}`,
  );
  const fracao = (100 * (b.x - a.x) * (b.y - a.y)) / (LADO * LADO);
  console.log(
    `    ela é ${fracao.toFixed(1)}% do canvas — pequena, e é por isso que passa despercebida`,
  );

  console.log(`\n  A FRONTEIRA DE BAIXO — onde a boca termina`);
  console.log(
    `    boca, centro        y ${(OLHO.cy + BOCA.abaixoDoOlho).toFixed(1)} u` +
      `   (espessura ${BOCA.espessura} u)`,
  );
  console.log(
    `    a barba começa em   y ${ROSTO.y1.toFixed(1)} u ou abaixo   ` +
      `— são ${(ROSTO.y1 - (OLHO.cy + BOCA.abaixoDoOlho)).toFixed(1)} u de folga sob a boca`,
  );
  console.log(
    `    o queixo termina em y ${CAIXA_CABECA.y1.toFixed(1)} u; abaixo de ` +
      `${Y_QUEIXO.toFixed(1)} u a peça é livre (Bloco 12)`,
  );

  console.log(`\n  A CANETA`);
  console.log(
    `    contorno do boneco  ${TRACO} u — a barba tem de chegar na MESMA espessura,\n` +
      `                        e é isso que a régua p50 vai medir depois`,
  );

  console.log(`\n  escrito             ${SAIDA}`);
  console.log(
    `\n  ⚠️  DIAGNÓSTICO — não anexe este arquivo ao Gemini. O que sobe é a base\n` +
      `      limpa (${PNG_BASE}); qualquer marca daqui seria copiada para a arte.`,
  );
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
