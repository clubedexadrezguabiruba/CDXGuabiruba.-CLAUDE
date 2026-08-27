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

import { CABELOS_DA_ARTE } from "../estilo/cabelos-da-arte";
import { ROSTOS_DA_ARTE } from "../estilo/rostos-da-arte";
import { TRAJES_DA_ARTE } from "../estilo/trajes-da-arte";

/**
 * Todo endereço que o catálogo declara, como caminho de disco a partir da raiz.
 *
 * São DUAS famílias hoje, e a segunda entrou em 2026-08-21:
 *
 *  - `tinta.arte` do TRAJE — o `.svg` da peça;
 *  - `tom.arte` do ROSTO — o `.png` da máscara de luminosidade, que deixou de ser
 *    base64 embutido quando o gzip do ranking mostrou o penhasco da janela do
 *    DEFLATE (ver `TomDaPeca` em `tipos.ts`).
 *
 * O modo de falha é IDÊNTICO nas duas, e é por isso que elas dividem este gate: o
 * compositor decide pelo campo declarado, nunca pelo arquivo existindo. Um `.png` de
 * tom que não viajasse levaria 404, o `<mask>` ficaria vazio — e máscara vazia não
 * mostra o desenho pela metade, ela **apaga a forma que veste**. A barba sairia só
 * com o preto de baixo, em produção, com todos os gates verdes.
 */
const ARTES = [
  ...Object.values(TRAJES_DA_ARTE).map((t) => t.tinta.arte),
  ...Object.values(ROSTOS_DA_ARTE).map((r) => r.tom?.arte),
  // O SLOT `cabelo` ENTROU EM 2026-08-22, e hoje ele contribui ZERO caminhos.
  //
  // `CABELOS_DA_ARTE` nasce vazio de propósito — o elenco é refeito arte a arte, com
  // parecer do Doug entre uma e outra. Ligá-lo aqui **antes** de haver peça é o que
  // faz a primeira promoção já nascer coberta: o gate não depende de alguém lembrar
  // de plugar o slot no dia em que a peça entrar. É o mesmo raciocínio da linha de
  // não-vacuidade logo abaixo, pelo lado contrário.
  //
  // O modo de falha é o mesmo das outras duas famílias, e no cabelo ele é pior: sem
  // a máscara, `var(--av-cabelo)` cede por inteiro e sobra `var(--av-linha)` — o
  // aluno escolhe loiro e o boneco aparece de cabelo PRETO, em produção, com todos
  // os gates verdes.
  ...Object.values(CABELOS_DA_ARTE).map((c) => c.tonal?.tom.arte),
]
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
  it("o catálogo declara pelo menos uma peça com arte — nas DUAS famílias", () => {
    // Sem esta linha o teste passaria vazio no dia em que o literal regredisse. E
    // são duas contagens porque um `.filter` que zerasse UMA das famílias deixaria a
    // outra segurando o total — o gate ficaria verde cobrindo metade do catálogo.
    expect(ARTES.length).toBeGreaterThan(0);
    expect(ARTES.filter((p) => p.endsWith(".svg")).length).toBeGreaterThan(0);
    expect(ARTES.filter((p) => p.endsWith(".png")).length).toBeGreaterThan(0);
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
