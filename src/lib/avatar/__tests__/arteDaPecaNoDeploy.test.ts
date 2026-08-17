/**
 * Gate do endereço: toda `tinta.arte` do catálogo tem de VIAJAR até o deploy.
 *
 * O defeito que este teste fecha é o mais silencioso desta rota, e custou uma
 * sessão inteira para ser visto: a peça nascia em `public/dev/traje/`, que a
 * linha 69 do `.gitignore` marca como "não viaja". Na máquina do desenvolvedor
 * tudo aparecia; no ar, o navegador pedia `/dev/traje/traje-farda.png`, levava
 * 404, e nada era colado.
 *
 * E o resultado NÃO era o fallback chapado que se supunha. `compositor.ts:391`
 * decide entre "tem arte" e "não tem arte" olhando **o campo declarado**, nunca o
 * arquivo existindo — então ele entrava no ramo "tem arte", suprimia a sombra do
 * queixo e o plano lateral, e a arte nunca chegava. O aluno vestido saía com
 * MENOS volume que o aluno sem traje nenhum: 17 formas contra 19, medido na
 * `arte:folha-traje`, com 42 328 px (farda) e 68 536 px (gambesão) de sombra,
 * luz e traço sumindo da tela.
 *
 * Existir no disco não é o teste — no disco de quem gerou existe sempre. O teste
 * é `git ls-files`: a Vercel builda a árvore do git, então **arquivo rastreado é
 * arquivo no ar**, e arquivo ignorado não chega lá por mais que esteja aqui.
 */

import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { describe, expect, it } from "vitest";

import { TRAJES_DA_ARTE } from "../estilo/trajes-da-arte";

/** As `tinta.arte` do catálogo, como caminho de disco a partir da raiz. */
const ARTES = Object.values(TRAJES_DA_ARTE)
  .map((t) => t.tinta.arte)
  .filter((p): p is string => !!p)
  .map((url) => `public${url}`);

/** O git conhece este caminho? Rastreado = vai no deploy. */
function rastreado(caminho: string): boolean {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", caminho], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

describe("a arte de cada peça chega ao deploy", () => {
  it("o catálogo declara pelo menos uma peça com arte", () => {
    // Sem esta linha o teste passaria vazio no dia em que o literal regredisse.
    expect(ARTES.length).toBeGreaterThan(0);
  });

  it.each(ARTES)("%s existe no disco", (caminho) => {
    expect(existsSync(caminho)).toBe(true);
  });

  it.each(ARTES)("%s é rastreado pelo git — logo, viaja", (caminho) => {
    expect(rastreado(caminho)).toBe(true);
  });

  it.each(ARTES)("%s mora na prateleira, não na oficina", (caminho) => {
    // `public/dev/` é a área de conferência: o que mora lá é rascunho por
    // definição, e uma criança pedindo `/dev/...` é a dívida se anunciando na
    // barra de endereço. A prateleira do produto é `public/items/`.
    expect(caminho.startsWith("public/dev/")).toBe(false);
    expect(caminho.startsWith("public/items/")).toBe(true);
  });
});
