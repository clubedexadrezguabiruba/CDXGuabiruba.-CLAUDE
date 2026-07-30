/**
 * Emite `avatar-base-sem-traje.svg` a partir da base aprovada.
 * `npm run avatar:base-sem-traje`
 *
 * POR QUE ISTO É UM ARQUIVO, e não uma regra de CSS.
 *
 * A pilha de runtime escondia o macacão com `.vestido .av-roupa{display:none}`.
 * Essa regra NUNCA funcionou: o conteúdo de `<use>` mora numa árvore-sombra que o
 * seletor do documento não atravessa. Medido de forma direta — a mesma base
 * renderizada com e sem a regra dá dois PNG **byte a byte idênticos**, enquanto o
 * mesmo seletor aplicado a conteúdo inline devolve `display: none`.
 *
 * O macacão continuava desenhado por baixo do uniforme e aparecia em cada vão que
 * a arte não cobre: 2626 px, medidos com cor sentinela, na gola, no punho e no
 * vão entre braço e tronco.
 *
 * Ausência estrutural é conferível: dá para procurar `av-roupa` no arquivo e não
 * achar. Ausência por CSS depende de o navegador concordar, e ele não concordava.
 *
 * DERIVADO, NÃO AUTORADO. Ele sai da base commitada por remoção de duas camadas,
 * então não há duas artes para manter em sincronia — regerar é reexecutar isto.
 */

import { readFileSync, writeFileSync } from "fs";
import { baseSemTraje } from "./sentinela";

const ENTRADA = "public/items/base/avatar-base-neutro.svg";
export const SAIDA = "public/items/base/avatar-base-sem-traje.svg";
export const ID_SEM_TRAJE = "avatar-base-sem-traje";

function main() {
  const bruta = readFileSync(ENTRADA, "utf-8");
  const saida = baseSemTraje(bruta, ID_SEM_TRAJE);

  for (const classe of ["av-roupa", "av-forro-roupa"]) {
    if (saida.includes(`class="${classe}"`)) throw new Error(`${classe} sobreviveu à remoção`);
  }
  for (const classe of ["av-pele", "av-forro-pele", "av-olho", "av-sobrancelha"]) {
    if (!saida.includes(`class="${classe}"`)) throw new Error(`${classe} sumiu, e não devia`);
  }

  writeFileSync(SAIDA, saida);
  const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
  console.log(`${SAIDA}`);
  console.log(`  ${kb(bruta.length)} → ${kb(saida.length)} · removidas av-roupa e av-forro-roupa`);
  console.log(`  mantidas: pele, forro de pele, rosto, olhos, sobrancelhas, mãos`);
}

if (process.argv[1]?.includes("gerar-base-sem-traje")) main();
