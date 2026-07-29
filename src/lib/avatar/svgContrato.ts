/**
 * Conferências de contrato do SVG do avatar.
 *
 * São funções puras, sem dependência, de propósito: rodam no vitest, no
 * gerador de assets e — se um dia fizer falta — no navegador. Elas existem
 * porque os dois defeitos que elas pegam **falham em silêncio**, e defeito
 * silencioso neste projeto já custou quatro meses uma vez.
 *
 *  1. **Comentário dentro do `<style>`.** Um `/* ... <path> ... *​/` fez o
 *     navegador descartar todas as regras seguintes. O boneco renderizava,
 *     só que sem cor nenhuma a partir daquele ponto. Nada acusou.
 *  2. **Custom property fora do contrato.** `var(--av-pelle)` não é erro de
 *     sintaxe: a variável não existe, o `fill` cai para o valor inicial e o
 *     elemento sai preto. Um boneco de rosto preto e nenhuma mensagem.
 */

import { PROPRIEDADES } from "./palette";

const CONTRATO = new Set<string>([...PROPRIEDADES.avatar, ...PROPRIEDADES.camada]);

export interface ProblemaSvg {
  tipo: "comentario-no-style" | "propriedade-fora-do-contrato";
  detalhe: string;
}

/** Conteúdo de cada bloco `<style>` do documento. */
function blocosDeEstilo(svg: string): string[] {
  return [...svg.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
}

/**
 * Confere um SVG contra o contrato. Devolve todos os problemas de uma vez —
 * um por execução transformaria a revisão de um desenho em muitas rodadas.
 */
export function conferirSvg(svg: string): ProblemaSvg[] {
  const problemas: ProblemaSvg[] = [];

  for (const bloco of blocosDeEstilo(svg)) {
    if (bloco.includes("/*")) {
      const trecho = bloco.slice(bloco.indexOf("/*"), bloco.indexOf("/*") + 60).replace(/\s+/g, " ");
      problemas.push({
        tipo: "comentario-no-style",
        detalhe:
          `comentário dentro do <style>: "${trecho}..." — ` +
          "o navegador pode descartar em silêncio todas as regras seguintes. " +
          "Comentário fica no gerador, não no SVG emitido.",
      });
    }
  }

  // Toda propriedade lida (var(--x)) e toda declarada (--x:) precisa estar
  // congelada em PROPRIEDADES, senão a folha global e o desenho divergem.
  const usadas = new Set<string>();
  for (const m of svg.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) usadas.add(m[1]);
  for (const m of svg.matchAll(/(--av-[a-z0-9-]+)\s*:/gi)) usadas.add(m[1]);

  for (const nome of [...usadas].sort()) {
    if (!CONTRATO.has(nome)) {
      problemas.push({
        tipo: "propriedade-fora-do-contrato",
        detalhe:
          `${nome} não está em PROPRIEDADES — o elemento renderizaria com o ` +
          "valor inicial (preto) e nada acusaria. Congele o nome em palette.ts " +
          "ou corrija o desenho.",
      });
    }
  }

  return problemas;
}

/** Versão que lança. Para usar no gerador de assets, onde parar é o correto. */
export function exigirSvgValido(svg: string, origem: string): void {
  const problemas = conferirSvg(svg);
  if (problemas.length > 0) {
    throw new Error(
      `SVG inválido (${origem}):\n` + problemas.map((p) => `  - ${p.detalhe}`).join("\n"),
    );
  }
}
