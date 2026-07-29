/**
 * Renderiza SVG em PNG usando o Chromium do Playwright.
 *
 * Por que Chromium e não sharp: o destino é o navegador. O sharp usa
 * librsvg, que suporta um subconjunto diferente de SVG/CSS — um erro de
 * suporte só apareceria em produção. Além disso o Playwright já é
 * dependência do projeto; o sharp seria dependência nativa nova.
 */

import { chromium, type Browser } from "@playwright/test";
import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

export interface Tamanho {
  nome: string;
  w: number;
  h: number;
}

/** Os 4 tamanhos do avatar v4 (canvas 4:5). O que manda é o sm. */
export const TAMANHOS: Tamanho[] = [
  { nome: "sm", w: 56, h: 70 },
  { nome: "md", w: 100, h: 125 },
  { nome: "lg", w: 200, h: 250 },
  { nome: "xl", w: 340, h: 425 },
];

export async function abrirNavegador(): Promise<Browser> {
  return chromium.launch();
}

/** Renderiza um SVG em PNG no tamanho exato, sem escala de dispositivo. */
export async function renderizarSvg(
  navegador: Browser,
  svg: string,
  w: number,
  h: number,
  saida: string,
  fundo = "transparent",
): Promise<void> {
  const pagina = await navegador.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
  });
  await pagina.setContent(
    `<!doctype html><html><body style="margin:0;background:${fundo}">
     <div style="width:${w}px;height:${h}px">${svg.replace(/<svg /, `<svg width="${w}" height="${h}" `)}</div>
     </body></html>`,
  );
  mkdirSync(dirname(saida), { recursive: true });
  await pagina.screenshot({ path: saida, omitBackground: fundo === "transparent" });
  await pagina.close();
}

/** Renderiza uma página HTML arbitrária (folhas de comparação). */
export async function renderizarHtml(
  navegador: Browser,
  html: string,
  w: number,
  saida: string,
): Promise<void> {
  const pagina = await navegador.newPage({ viewport: { width: w, height: 400 }, deviceScaleFactor: 1 });
  await pagina.setContent(html);
  mkdirSync(dirname(saida), { recursive: true });
  await pagina.screenshot({ path: saida, fullPage: true });
  await pagina.close();
}

export function salvar(caminho: string, conteudo: string) {
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, conteudo, "utf-8");
}
