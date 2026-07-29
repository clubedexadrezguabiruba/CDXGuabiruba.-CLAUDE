/**
 * Varredura de `public/items/` — fonte única do que existe em disco.
 *
 * Módulo separado de gen-manifest.ts porque o gate de verificação
 * (scripts/verify/phase8/verify-avatar-assets.ts) precisa varrer o disco sem
 * disparar a regravação do manifesto como efeito colateral do import.
 */

import { readdirSync, statSync } from "fs";
import { join, relative, resolve } from "path";

export const DIR_ASSETS = resolve(process.cwd(), "public/items");

/** Extensões que contam como asset de avatar. */
const EXTENSOES = [".png", ".svg", ".webp", ".apng", ".gif"];

/**
 * Devolve os caminhos web (`/items/head/bone-peao.png`) de todo asset em
 * `public/items/`, ordenados e com barra normal em qualquer sistema.
 */
export function varrerAssets(dir: string = DIR_ASSETS): string[] {
  const encontrados: string[] = [];

  function descer(atual: string) {
    for (const entrada of readdirSync(atual)) {
      const caminho = join(atual, entrada);
      if (statSync(caminho).isDirectory()) {
        descer(caminho);
        continue;
      }
      if (!EXTENSOES.some((e) => entrada.toLowerCase().endsWith(e))) continue;
      encontrados.push("/items/" + relative(dir, caminho).split(/[\\/]/).join("/"));
    }
  }

  descer(dir);
  return encontrados.sort();
}
