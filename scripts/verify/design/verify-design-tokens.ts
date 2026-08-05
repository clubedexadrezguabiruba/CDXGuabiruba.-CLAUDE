/**
 * GATE DOS TOKENS DE DESIGN (3 seções duras + 1 ratchet)
 *
 * O QUE ESTE GATE EXISTE PARA IMPEDIR
 *
 *   1. Declaração dupla ou morta. Os 8 tokens de marca ficaram meses declarados
 *      em DOIS lugares — `tailwind.config.ts` e um `:root` no globals.css com
 *      ZERO usos. Os hexes batiam por sorte. Um token declarado duas vezes é
 *      uma divergência esperando acontecer; declarado zero vezes é uma classe
 *      que compila e não faz nada.
 *
 *   2. O no-op silencioso. No Tailwind v4 um typo (`bg-warm-ivroy`) não quebra
 *      o build — a classe simplesmente não gera CSS. O erro só aparece na tela,
 *      e só para quem olhar. A S2 pega isso de graça: toda utility cujo nome
 *      começa com radical de marca tem de resolver para um token da régua.
 *
 *   3. O drift de cópia. `design-lab/data.ts` copiou a tabela de PATENTES à mão
 *      e a cópia divergiu da fonte (Soldado com `detalhe` que na fonte é null).
 *      Régua se importa, não se copia.
 *
 *   4. A dívida que volta a crescer. 72 arquivos usam cor crua do Tailwind
 *      (zinc-, amber-…). O gate é um RATCHET, não uma limpeza retroativa: o
 *      legado está congelado no baseline e o CRESCIMENTO reprova.
 *
 * POR QUE ELE RODA OFFLINE: só lê arquivos do repositório. Nenhum banco.
 *
 * LIMITE CONHECIDO: o gate mede classes e declarações, não a tela. Um token
 * certo no elemento errado (ouro em botão comum, Cinzel em corpo) só o
 * screenshot pega — `npm run shot:design` e o laço do DESIGN.md.
 *
 * Uso: npm run verify:design-tokens              (checa)
 *      npm run verify:design-tokens -- --update  (regrava o baseline; explique
 *                                                 no commit por quê)
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { resolve, join, relative } from "path";
import {
  TOKENS,
  ANIMACOES,
  SOMBRAS,
  FAMILIA_BANIDA,
  VARIANTE_BANIDA,
  PREFIXOS_COR,
  ISENTOS,
  regexCoresCruas,
  regexCandidatoMarca,
} from "../../design/tokens";

const BASELINE_PATH = "scripts/verify/design/cores-cruas-baseline.json";
const CONFIG_PATH = "tailwind.config.ts";

// ---------------------------------------------------------------------------
// Coleta
// ---------------------------------------------------------------------------

function listarArquivos(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules") continue;
      out.push(...listarArquivos(full, exts));
    } else if (exts.some((e) => entry.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

const raiz = process.cwd();
const arquivosSrc = listarArquivos(resolve(raiz, "src"), [".ts", ".tsx"]);
const arquivosCss = listarArquivos(resolve(raiz, "src"), [".css"]);
const config = existsSync(resolve(raiz, CONFIG_PATH))
  ? readFileSync(resolve(raiz, CONFIG_PATH), "utf-8")
  : null;

function relPosix(abs: string): string {
  return relative(raiz, abs).replace(/\\/g, "/");
}

/**
 * Chave declarada no tailwind.config. Aceita `"gold":` e `gold:` — no JS o
 * quoting depende de haver hífen no nome, e tratar as duas formas de modo
 * diferente faria o gate reprovar `font-heading`, que está declarado.
 */
function chaveNoConfig(chave: string): boolean {
  return config !== null && new RegExp(`(^|[\\s{,])"?${chave}"?\\s*:`, "m").test(config);
}

function ehIsento(rel: string): boolean {
  return ISENTOS.some((p) => rel.startsWith(p));
}

// ---------------------------------------------------------------------------
// Medição
// ---------------------------------------------------------------------------

const violacoes: string[] = [];
const linhas: string[] = [];

function checar(ok: boolean, rotulo: string, detalhe: string) {
  linhas.push(`  [${ok ? "PASS" : "FAIL"}] ${rotulo} — ${detalhe}`);
  if (!ok) violacoes.push(`${rotulo} — ${detalhe}`);
}

function despejarSecao() {
  console.log(linhas.join("\n"));
  linhas.length = 0;
}

function main() {
  const args = process.argv.slice(2);
  const cssTodo = arquivosCss.map((f) => readFileSync(f, "utf-8")).join("\n");
  const srcConteudo = new Map(
    arquivosSrc.map((f) => [relPosix(f), readFileSync(f, "utf-8")] as const)
  );

  // --- S4 precisa das contagens mesmo em --update -------------------------
  const reCruas = regexCoresCruas();
  const contagens: Record<string, number> = {};
  for (const [rel, conteudo] of srcConteudo) {
    if (ehIsento(rel)) continue;
    const n = (conteudo.match(reCruas) ?? []).length;
    if (n > 0) contagens[rel] = n;
  }

  if (args.includes("--update")) {
    const ordenado = Object.fromEntries(
      Object.entries(contagens).sort((a, b) => b[1] - a[1])
    );
    writeFileSync(
      resolve(raiz, BASELINE_PATH),
      JSON.stringify(ordenado, null, 2) + "\n"
    );
    const total = Object.values(contagens).reduce((s, c) => s + c, 0);
    console.log(
      `Baseline regravado: ${total} cores cruas em ${Object.keys(contagens).length} arquivos.`
    );
    console.log("Explique no commit por que o baseline mudou.");
    return;
  }

  console.log("========================================");
  console.log("GATE: tokens de design");
  console.log("========================================");

  // --- S1 -----------------------------------------------------------------
  console.log(
    "\n1. Declaração única — duas declarações divergem, zero declara um no-op"
  );
  for (const { nome } of TOKENS) {
    const fontes: string[] = [];
    if (chaveNoConfig(nome)) fontes.push(CONFIG_PATH);
    const reTheme = new RegExp(`--color-${nome}\\s*:`, "g");
    const reLegado = new RegExp(`(^|[^\\w-])--${nome}\\s*:`, "gm");
    const nTheme = (cssTodo.match(reTheme) ?? []).length;
    const nLegado = (cssTodo.match(reLegado) ?? []).length;
    for (let i = 0; i < nTheme; i++) fontes.push("css @theme");
    for (let i = 0; i < nLegado; i++) fontes.push("css :root (forma legada)");
    checar(
      fontes.length === 1,
      nome,
      fontes.length === 0 ? "NENHUMA declaração" : `${fontes.length} declarações (${fontes.join(", ")})`
    );
  }
  despejarSecao();

  // --- S2 -----------------------------------------------------------------
  console.log(
    "\n2. Anti-no-op — typo em classe de marca compila e simplesmente some da tela"
  );
  const nomesValidos = new Set(TOKENS.map((t) => t.nome));
  const reCandidato = regexCandidatoMarca();
  const desconhecidos = new Map<string, string[]>();
  for (const [rel, conteudo] of srcConteudo) {
    for (const m of conteudo.matchAll(reCandidato)) {
      const nome = m[1].replace(/-+$/, "");
      if (!nomesValidos.has(nome)) {
        if (!desconhecidos.has(nome)) desconhecidos.set(nome, []);
        desconhecidos.get(nome)!.push(rel);
      }
    }
  }
  checar(
    desconhecidos.size === 0,
    "utilities de marca resolvem",
    desconhecidos.size === 0
      ? "todas resolvem para token da régua"
      : [...desconhecidos.entries()]
          .map(([n, fs]) => `"${n}" não é token (${[...new Set(fs)].join(", ")})`)
          .join("; ")
  );

  const hexArbitrarios: string[] = [];
  for (const { nome, hex } of TOKENS) {
    const re = new RegExp(`\\[${hex.replace("#", "#")}\\]`, "gi");
    for (const [rel, conteudo] of srcConteudo) {
      const n = (conteudo.match(re) ?? []).length;
      if (n > 0) hexArbitrarios.push(`${hex} (${nome}) ${n}× em ${rel}`);
    }
  }
  checar(
    hexArbitrarios.length === 0,
    "hex da régua nunca como arbitrário",
    hexArbitrarios.length === 0 ? "nenhum [#hex] da régua em src" : hexArbitrarios.join("; ")
  );

  const semDeclaracao: string[] = [];
  const declarado = (chave: string, varCss: string): boolean =>
    chaveNoConfig(chave) || new RegExp(`${varCss}\\s*:`).test(cssTodo);
  for (const nome of ANIMACOES) {
    const usada = [...srcConteudo.values()].some((c) => c.includes(`animate-${nome}`));
    if (usada && !declarado(nome, `--animate-${nome}`)) {
      semDeclaracao.push(`animate-${nome}`);
    }
  }
  for (const nome of SOMBRAS) {
    const usada = [...srcConteudo.values()].some((c) => c.includes(`shadow-${nome}`));
    if (usada && !declarado(nome, `--shadow-${nome}`)) {
      semDeclaracao.push(`shadow-${nome}`);
    }
  }
  for (const nome of ["heading", "sans"]) {
    const usada = [...srcConteudo.values()].some((c) => c.includes(`font-${nome}`));
    if (usada && !declarado(nome, `--font-${nome}`)) {
      semDeclaracao.push(`font-${nome}`);
    }
  }
  checar(
    semDeclaracao.length === 0,
    "animações/sombras/fontes usadas têm declaração",
    semDeclaracao.length === 0 ? "todas declaradas" : semDeclaracao.join(", ")
  );
  despejarSecao();

  // --- S3 -----------------------------------------------------------------
  console.log("\n3. Proibições a seco — hoje é zero, e zero fica");
  const reGray = new RegExp(
    `\\b(?:${PREFIXOS_COR.join("|")})-${FAMILIA_BANIDA}-\\d{2,3}`,
    "g"
  );
  let usosGray = 0;
  let usosDark = 0;
  for (const conteudo of srcConteudo.values()) {
    usosGray += (conteudo.match(reGray) ?? []).length;
    usosDark += (conteudo.match(new RegExp(`\\b${VARIANTE_BANIDA}`, "g")) ?? []).length;
  }
  checar(usosGray === 0, `família ${FAMILIA_BANIDA}-`, `${usosGray} usos (a família neutra é zinc→ink)`);
  checar(usosDark === 0, `variante ${VARIANTE_BANIDA}`, `${usosDark} usos (produto é light-only por decisão)`);
  despejarSecao();

  // --- S4 -----------------------------------------------------------------
  console.log("\n4. Ratchet das cores cruas — o legado é aceito, o crescimento não");
  const baseline: Record<string, number> = JSON.parse(
    readFileSync(resolve(raiz, BASELINE_PATH), "utf-8")
  );
  for (const [rel, n] of Object.entries(contagens)) {
    const limite = baseline[rel];
    if (limite === undefined) {
      checar(false, rel, `arquivo novo já com ${n} cores cruas (comece com tokens)`);
    } else if (n > limite) {
      checar(false, rel, `${n} cores cruas (baseline ${limite}, +${n - limite})`);
    }
  }
  if (violacoes.length === 0 || linhas.length === 0) {
    linhas.push("  [PASS] nenhum arquivo acima do baseline");
  }
  despejarSecao();

  const total = Object.values(contagens).reduce((s, c) => s + c, 0);
  const totalBase = Object.values(baseline).reduce((s, c) => s + c, 0);
  const piores = Object.entries(contagens)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  console.log(`\nEstado: ${total} cores cruas em ${Object.keys(contagens).length} arquivos (baseline: ${totalBase})`);
  console.log("Topo da dívida:");
  for (const [rel, n] of piores) console.log(`  ${rel}: ${n}`);

  // --- Resultado ----------------------------------------------------------
  if (violacoes.length > 0) {
    console.log("\n========================================");
    console.log(`RESULTADO: ${violacoes.length} violações`);
    console.log("========================================\n");
    for (const v of violacoes) console.log(`  [FAIL] ${v}`);
    console.log(
      "\nToken declarado duas vezes foi como a marca viveu meses com um :root"
    );
    console.log(
      "morto; typo de token compila e some da tela sem erro. Corrija na fonte"
    );
    console.log("(globals.css @theme / scripts/design/tokens.ts), ou --update com motivo.");
    process.exit(1);
  }

  console.log("\n========================================");
  console.log("RESULTADO: 0 violações");
  console.log("========================================");
  console.log("\nGate tokens de design: OK");
}

main();
