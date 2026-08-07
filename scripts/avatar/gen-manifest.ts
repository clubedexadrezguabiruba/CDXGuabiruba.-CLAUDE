/**
 * Gerador do manifesto de assets do avatar (T0.1 / D20).
 *
 * POR QUE ISTO EXISTE
 * -------------------
 * O resolver montava o caminho do asset por convenção de nome
 * (`bandana-tatica.png` → `bandana-tatica-swap-male.png`) e o componente
 * devolvia `null` no `onError` da <img>. As duas coisas juntas produzem o
 * pior tipo de bug: o item entra no inventário, a criança equipa, e o boneco
 * não muda — sem erro em lugar nenhum. Foi assim que 45 dos 77 itens do
 * catálogo ficaram invisíveis sem ninguém notar.
 *
 * O manifesto é a lista do que REALMENTE existe em `public/items/`. Com ele,
 * "o arquivo não existe" vira um fato consultável em tempo de build e de
 * render, em vez de um 404 silencioso no navegador da criança.
 *
 * MODOS
 * -----
 *   npm run avatar:manifest           regenera src/lib/avatar/assetManifest.ts
 *   npm run avatar:manifest -- --check falha se o arquivo commitado divergir
 *
 * O modo --check roda no `prebuild`: adicionar ou remover um PNG sem
 * regenerar o manifesto quebra o build. É filesystem puro, não toca o banco.
 */

import { readFileSync, writeFileSync } from "fs";
import { relative, resolve } from "path";
import { varrerAssets } from "./asset-scan";

const RAIZ = process.cwd();
const ARQUIVO_SAIDA = resolve(RAIZ, "src/lib/avatar/assetManifest.ts");

function renderarArquivo(caminhos: string[]): string {
  const linhas = caminhos.map((c) => `  ${JSON.stringify(c)},`).join("\n");
  return `/**
 * ARQUIVO GERADO — NÃO EDITAR À MÃO.
 *
 * Gerado por \`npm run avatar:manifest\` a partir de \`public/items/\`.
 * O \`prebuild\` roda \`--check\` e quebra o build se este arquivo divergir
 * do disco, para que nenhum asset entre ou saia sem o manifesto saber.
 *
 * Por que o manifesto existe: ver o cabeçalho de scripts/avatar/gen-manifest.ts.
 */

/** Todo asset presente em public/items/, como caminho web. */
export const AVATAR_ASSETS: readonly string[] = [
${linhas}
];

const CONJUNTO: ReadonlySet<string> = new Set(AVATAR_ASSETS);

/** true se o arquivo existe em public/items/. Consulta O(1), sem I/O. */
export function assetExiste(caminho: string | null | undefined): boolean {
  if (!caminho) return false;
  return CONJUNTO.has(caminho);
}
`;
}

function main() {
  const conferir = process.argv.includes("--check");
  const caminhos = varrerAssets();
  const conteudo = renderarArquivo(caminhos);

  if (!conferir) {
    writeFileSync(ARQUIVO_SAIDA, conteudo, "utf-8");
    console.log(`Manifesto gerado: ${caminhos.length} assets em ${relative(RAIZ, ARQUIVO_SAIDA)}`);
    return;
  }

  // AS QUEBRAS DE LINHA SÃO NORMALIZADAS ANTES DE COMPARAR, e isto não é zelo: o
  // gerador escreve `\n`, o git desta máquina tem `core.autocrlf=true` e devolve
  // `\r\n` no `checkout`. Comparando bytes crus, o `prebuild` reprovava **todo
  // arquivo que o git tivesse tocado** — `npm run build` estava vermelho por isso, e
  // a mensagem "a lista bate, mas o arquivo difere" mandava regerar um arquivo que
  // já estava em dia. `gerar-livro-aberturas.ts:116` já fazia isto.
  const semCR = (s: string) => s.replace(/\r\n?/g, "\n");
  const atual = readFileSync(ARQUIVO_SAIDA, "utf-8");
  if (semCR(atual) === semCR(conteudo)) {
    console.log(`Manifesto de assets em dia (${caminhos.length} arquivos).`);
    return;
  }

  const noDisco = new Set(caminhos);
  const noManifesto = new Set(
    [...atual.matchAll(/^ {2}"(\/items\/[^"]+)",$/gm)].map((m) => m[1]),
  );
  const sobrando = [...noDisco].filter((c) => !noManifesto.has(c));
  const faltando = [...noManifesto].filter((c) => !noDisco.has(c));

  console.error("\nMANIFESTO DE ASSETS DESATUALIZADO");
  console.error("=================================");
  if (sobrando.length) {
    console.error(`\n  ${sobrando.length} arquivo(s) no disco fora do manifesto:`);
    for (const c of sobrando) console.error(`    + ${c}`);
  }
  if (faltando.length) {
    console.error(`\n  ${faltando.length} caminho(s) no manifesto que sumiram do disco:`);
    for (const c of faltando) console.error(`    - ${c}`);
  }
  if (!sobrando.length && !faltando.length) {
    console.error("\n  A lista bate, mas o arquivo difere (formatação ou cabeçalho).");
  }
  console.error("\n  Corrija com: npm run avatar:manifest\n");
  process.exit(1);
}

main();
