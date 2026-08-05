/**
 * PAINEL DE ESTADO — "onde estamos", medido em vez de digitado
 *
 * O QUE ESTE SCRIPT EXISTE PARA IMPEDIR
 * -------------------------------------
 * Em 2026-08-03 uma auditoria contou **13 superfícies** afirmando o estado do
 * projeto (CLAUDE.md, README, Roadmap, doc 14, doc 15, MEMORY.md, …) espalhadas
 * por 45 arquivos .md. Nos fatos estáveis elas concordavam — ao custo de até seis
 * cópias literais. Em tudo que se mexe, discordavam:
 *
 *   - gates do `verify:all`: 11 (README, Roadmap) · 14 (guia) · 15 (MEMORY)
 *   - tarefas do backlog: 63 (CLAUDE.md) contra 66 reais
 *   - itens sem render: "14 de 16" (MEMORY.md) contra 45 de 77
 *   - proporção do boneco: 1:3, revogada para ≈1:2 três dias antes
 *
 * O projeto já tinha diagnosticado a doença duas vezes e escrito a lição:
 *
 *   docs/avatar/14-backlog-execucao.md:427
 *     "número escrito à mão envelhece calado"
 *   .github/workflows/ci.yml:83
 *     "Sem contagem aqui de propósito: o número já apodreceu duas vezes."
 *
 * Nas duas vezes o remédio foi um **comentário**, e comentário não roda. Este
 * script é o remédio que roda: todo número do painel é recontado a cada geração,
 * a partir do repositório. Um painel escrito à mão viraria só a 14ª superfície
 * contraditória.
 *
 * O QUE É MEDIDO E O QUE É ESCRITO
 * --------------------------------
 * Tudo é medido, MENOS o bloco entre `AGORA:inicio` e `AGORA:fim` — o "próximo
 * passo", que é julgamento humano e nenhum script deriva. Esse bloco sobrevive
 * intacto a cada regeneração.
 *
 * As regiões entre `VOLATIL:inicio` e `VOLATIL:fim` dependem de git (branch,
 * commits à frente, árvore suja, datas). O gate `verify:estado` as ignora ao
 * comparar, porque num clone raso do CI elas legitimamente diferem — o que o
 * gate trava são as contagens derivadas de arquivo, que têm de bater em qualquer
 * máquina.
 *
 * Roda offline, sem banco e sem rede — como os outros gates, para caber no CI.
 *
 * Uso: npm run estado
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, realpathSync } from "fs";
import { execFileSync } from "child_process";
import { join } from "path";
import { fileURLToPath } from "url";

export const PAINEL = "docs/ESTADO.md";

const AGORA_INICIO = "<!-- AGORA:inicio -->";
const AGORA_FIM = "<!-- AGORA:fim -->";
const VOLATIL_INICIO = "<!-- VOLATIL:inicio -->";
const VOLATIL_FIM = "<!-- VOLATIL:fim -->";

/** O que o bloco "Agora" traz quando o painel ainda não existe. */
const AGORA_PADRAO = [
  "- _(escreva aqui o próximo passo — é a única parte deste arquivo que é sua)_",
].join("\n");

// ---------------------------------------------------------------------------
// Leitura tolerante
//
// Um doc pode ser renomeado ou arquivado por outra sessão no meio do caminho —
// aconteceu durante a própria auditoria que motivou este script. O painel tem de
// dizer "sumiu" em vez de explodir, senão vira mais uma coisa que não roda.
// ---------------------------------------------------------------------------

function ler(caminho: string): string | null {
  try {
    return readFileSync(caminho, "utf-8");
  } catch {
    return null;
  }
}

/** Saída de um comando git, ou `null` se o git não puder responder. */
function git(...args: string[]): string | null {
  try {
    return execFileSync("git", args, { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

/** Arquivos sob `raiz` que casam com `filtro`, recursivamente. */
function varrer(raiz: string, filtro: (nome: string) => boolean): string[] {
  const achados: string[] = [];
  function desce(dir: string) {
    let entradas;
    try {
      entradas = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entradas) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const caminho = join(dir, e.name);
      if (e.isDirectory()) desce(caminho);
      else if (filtro(e.name)) achados.push(caminho);
    }
  }
  desce(raiz);
  return achados.sort();
}

// ---------------------------------------------------------------------------
// Os gates
//
// A régua é o `package.json`, não a prosa. `verify:all` encadeia entradas com
// `&&`, e uma delas (`verify:phase8`) encadeia outras quatro — contar as entradas
// dá 15 e contar os scripts que de fato rodam dá 18. Os dois números são certos e
// respondem a perguntas diferentes; o painel diz os dois para ninguém precisar
// escolher errado. E `verify:all` DIFERE ENTRE BRANCHES: a `main` não tem
// `verify:pose` nem `verify:design-tokens`. Por isso o painel nomeia a branch.
// ---------------------------------------------------------------------------

export type Gates = { entradas: string[]; folhas: string[] };

export function medirGates(pkgTexto: string): Gates {
  const scripts: Record<string, string> = JSON.parse(pkgTexto).scripts ?? {};

  const nomesDe = (corpo: string): string[] =>
    [...corpo.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1]!);

  const entradas = nomesDe(scripts["verify:all"] ?? "");

  const folhas: string[] = [];
  const vistos = new Set<string>();
  function expandir(nome: string) {
    if (vistos.has(nome)) return;
    vistos.add(nome);
    const corpo = scripts[nome] ?? "";
    const filhos = nomesDe(corpo);
    if (filhos.length === 0) folhas.push(nome);
    else filhos.forEach(expandir);
  }
  entradas.forEach(expandir);

  return { entradas, folhas };
}

// ---------------------------------------------------------------------------
// As fases do produto — a tabela §"Estado real" do Roadmap
//
// O resto daquele documento foi escrito antes do projeto começar e o próprio doc
// avisa que só esta tabela vale. O painel lê a tabela, não a Parte 1.
// ---------------------------------------------------------------------------

export type Fase = { rotulo: string; feita: boolean; nota: string };

export function medirFases(roadmap: string | null): Fase[] {
  if (!roadmap) return [];
  const trecho = roadmap.split(/^## Estado real/m)[1] ?? "";
  const tabela = trecho.split(/^\*\*/m)[0] ?? "";
  return tabela
    .split("\n")
    .filter((l) => /^\|/.test(l) && /[✅❌]/.test(l))
    .map((l) => {
      const c = l.split("|").slice(1, -1).map((x) => x.trim());
      const rotulo = (c[0] ?? "").replace(/\*\*/g, "");
      const estado = c[1] ?? "";
      // A nota é o que vem depois do "— ", quando existe.
      const nota = estado.split("—").slice(1).join("—").trim().replace(/\*\*/g, "");
      return { rotulo, feita: estado.includes("✅"), nota };
    });
}

// ---------------------------------------------------------------------------
// Os checkboxes
//
// Há DUAS definições legítimas de "tarefa" no doc 14, e confundi-las foi o que
// produziu a falsa contradição "66 contra 76" na auditoria:
//
//   - tarefas NUMERADAS (`- [x] **T0.1**`) — é o que a tabela-resumo do doc conta
//   - TODOS os checkboxes — inclui as linhas de gate (`- [x] 🔒 **Gate:** …`)
//
// O painel reporta a numerada, que é a régua do próprio documento, e diz isso.
// ---------------------------------------------------------------------------

export type Contagem = { fechadas: number; abertas: number; total: number };

export function contarNumeradas(doc: string | null): Contagem {
  if (!doc) return { fechadas: 0, abertas: 0, total: 0 };
  const unicos = (marca: string) =>
    new Set(
      [...doc.matchAll(new RegExp(`^- \\[${marca}\\] \\*\\*(T\\d+\\.\\d+[a-z]?)\\*\\*`, "gm"))].map(
        (m) => m[1]!,
      ),
    ).size;
  const fechadas = unicos("x");
  const abertas = unicos(" ");
  return { fechadas, abertas, total: fechadas + abertas };
}

export function contarCheckboxes(doc: string | null): Contagem {
  if (!doc) return { fechadas: 0, abertas: 0, total: 0 };
  const conta = (re: RegExp) => (doc.match(re) ?? []).length;
  const fechadas = conta(/^- \[x\]/gm);
  const abertas = conta(/^- \[ \]/gm);
  return { fechadas, abertas, total: fechadas + abertas };
}

/** Fechadas/total por fase (F0, F1, …), lendo os cabeçalhos `# F0 — …`. */
export function porFase(doc: string | null): Array<{ fase: string; c: Contagem }> {
  if (!doc) return [];
  const partes = doc.split(/^# (F\d)[^\n]*$/m);
  const saida: Array<{ fase: string; c: Contagem }> = [];
  for (let i = 1; i < partes.length; i += 2) {
    const fase = partes[i]!;
    const corpo = partes[i + 1] ?? "";
    saida.push({ fase, c: contarNumeradas(corpo) });
  }
  return saida;
}

// ---------------------------------------------------------------------------
// O passivo congelado
//
// Três ratchets guardam dívida que só encolhe. O painel mostra o tamanho E a
// data: um passivo que não encolhe há semanas é informação, e hoje ela não
// aparece em lugar nenhum.
// ---------------------------------------------------------------------------

export type Passivo = { rotulo: string; valor: string; desde: string };

function lerJson(caminho: string): Record<string, unknown> | null {
  const t = ler(caminho);
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

export function medirPassivo(): Passivo[] {
  const saida: Passivo[] = [];

  const assets = lerJson("scripts/verify/phase8/asset-baseline.json");
  if (assets) {
    const semBoneco = (assets["sem_boneco"] as unknown[] | undefined)?.length ?? 0;
    const semMini = (assets["sem_miniatura"] as unknown[] | undefined)?.length ?? 0;
    const orfaos = (assets["arquivos_orfaos"] as unknown[] | undefined)?.length ?? 0;
    const desde = String(assets["gerado_em"] ?? "—");
    saida.push({ rotulo: "Itens que não vestem o boneco", valor: String(semBoneco), desde });
    saida.push({ rotulo: "Itens sem miniatura", valor: String(semMini), desde });
    if (orfaos) saida.push({ rotulo: "Arquivos órfãos", valor: String(orfaos), desde });
  }

  const cores = lerJson("scripts/verify/design/cores-cruas-baseline.json");
  if (cores) {
    const arquivos = Object.keys(cores).length;
    const total = Object.values(cores).reduce<number>(
      (a, v) => a + (typeof v === "number" ? v : 0),
      0,
    );
    // É o TETO tolerado, não a contagem de hoje: o baseline só encolhe com
    // `--update`, então ele fica acima do real assim que alguém limpa uma tela.
    saida.push({
      rotulo: "Cores cruas — teto tolerado",
      valor: `${total} em ${arquivos} arquivos`,
      desde: "ratchet",
    });
  }

  const rpc = lerJson("scripts/verify/security/rpc-baseline.json");
  if (rpc) {
    const entradas = Object.keys(rpc).length;
    const pior = Object.entries(rpc)
      .filter(([, v]) => typeof v === "number")
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    saida.push({
      rotulo: "RPCs redefinidas mais de uma vez",
      valor: pior ? `${entradas} (pior: ${pior[0]}, ${pior[1]}×)` : String(entradas),
      desde: "ratchet",
    });
  }

  return saida;
}

// ---------------------------------------------------------------------------
// A montagem
// ---------------------------------------------------------------------------

/** Uma tabela markdown de duas colunas, sem cabeçalho visível. */
function paresParaTabela(pares: Array<[string, string]>): string {
  return ["| | |", "|---|---|", ...pares.map(([a, b]) => `| **${a}** | ${b} |`)].join("\n");
}

export function gerarPainel(agora: string): string {
  const L: string[] = [];

  // --- medições que independem de git ------------------------------------
  const pkg = ler("package.json");
  const gates = pkg ? medirGates(pkg) : { entradas: [], folhas: [] };
  const roadmap = ler("docs/Recruta64_Roadmap_Tecnico_v1.md");
  const fases = medirFases(roadmap);
  const doc14 = ler("docs/avatar/14-backlog-execucao.md");
  const doc13 = ler("docs/avatar/13-checklist-de-verificacao.md");
  const backlog = contarNumeradas(doc14);
  const auditoria = contarCheckboxes(doc13);
  const fasesAvatar = porFase(doc14);
  const passivo = medirPassivo();

  const migrations = existsSync("supabase/migrations")
    ? readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).length
    : 0;
  const rotas = varrer("src/app", (n) => n === "page.tsx").length;
  const testes = varrer("src", (n) => /\.(test|spec)\.tsx?$/.test(n)).length;
  const primitivos = existsSync("src/components/ui")
    ? readdirSync("src/components/ui").filter((f) => f.endsWith(".tsx")).length
    : 0;

  // --- cabeçalho ---------------------------------------------------------
  L.push("# Estado — Recruta 64");
  L.push("");
  L.push("> **Este arquivo é gerado. Não edite à mão** — o gate `verify:estado` reprova se");
  L.push("> você editar. A única parte sua é o bloco **Agora**, logo abaixo, que sobrevive a");
  L.push("> cada regeneração. Todo o resto é recontado do repositório por `npm run estado`.");
  L.push(">");
  L.push("> Existe porque o estado deste projeto vivia em 13 lugares que discordavam entre si.");
  L.push("> Ver o cabeçalho de `scripts/estado.ts` para os números daquela auditoria.");
  L.push("");

  // --- Agora (escrito à mão) --------------------------------------------
  L.push("## Agora");
  L.push("");
  L.push(AGORA_INICIO);
  L.push(agora.trim());
  L.push(AGORA_FIM);
  L.push("");

  // --- Git (volátil) -----------------------------------------------------
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const ultimo = git("log", "-1", "--format=%h · %ad · %s", "--date=short");
  const sujo = git("status", "--porcelain");
  const aFrente = git("rev-list", "--count", "origin/main..HEAD");

  L.push("## Git");
  L.push("");
  L.push(VOLATIL_INICIO);
  L.push(
    paresParaTabela([
      ["Branch", branch ? `\`${branch}\`` : "—"],
      ["Commits à frente de `origin/main`", aFrente ?? "— _(sem `origin/main` local)_"],
      [
        "Árvore",
        sujo === null ? "—" : sujo === "" ? "limpa" : `**${sujo.split("\n").length} arquivos sujos**`,
      ],
      ["Último commit", ultimo ?? "—"],
    ]),
  );
  L.push(VOLATIL_FIM);
  L.push("");

  // --- Fases -------------------------------------------------------------
  const feitas = fases.filter((f) => f.feita).length;
  const abertas = fases.filter((f) => !f.feita);
  L.push("## Fases do produto");
  L.push("");
  if (fases.length === 0) {
    L.push("_Não consegui ler a tabela §Estado real do Roadmap._");
  } else {
    L.push(`**${feitas} de ${fases.length} feitas.**`);
    L.push("");
    if (abertas.length === 0) L.push("Nenhuma fase aberta.");
    else {
      L.push("Abertas:");
      L.push("");
      for (const f of abertas) L.push(`- **${f.rotulo}**${f.nota ? ` — ${f.nota}` : ""}`);
    }
    L.push("");
    L.push("_Fonte: tabela §Estado real de `docs/Recruta64_Roadmap_Tecnico_v1.md`._");
  }
  L.push("");

  // --- Gates -------------------------------------------------------------
  L.push("## Gates");
  L.push("");
  L.push(
    `**${gates.entradas.length} entradas** em \`verify:all\`, que expandem para ` +
      `**${gates.folhas.length} scripts**. O número difere entre branches — ` +
      "a `main` não tem `verify:pose` nem `verify:design-tokens`.",
  );
  L.push("");
  L.push(gates.folhas.map((g) => `\`${g}\``).join(" · "));
  L.push("");

  // --- Frentes -----------------------------------------------------------
  L.push("## Frentes");
  L.push("");
  const pct = (c: Contagem) => (c.total === 0 ? "—" : `${Math.round((c.fechadas / c.total) * 100)}%`);
  L.push("| frente | fechadas | detalhe em |");
  L.push("|---|---|---|");
  L.push(
    `| Backlog do avatar | **${backlog.fechadas} de ${backlog.total}** (${pct(backlog)}) | \`docs/avatar/14-backlog-execucao.md\` |`,
  );
  L.push(
    `| Auditoria do avatar | **${auditoria.fechadas} de ${auditoria.total}** (${pct(auditoria)}) | \`docs/avatar/13-checklist-de-verificacao.md\` |`,
  );
  L.push("");
  if (fasesAvatar.length) {
    L.push("Backlog do avatar, fase a fase:");
    L.push("");
    L.push("| " + fasesAvatar.map((f) => f.fase).join(" | ") + " |");
    L.push("|" + fasesAvatar.map(() => "---").join("|") + "|");
    L.push("| " + fasesAvatar.map((f) => `${f.c.fechadas}/${f.c.total}`).join(" | ") + " |");
    L.push("");
  }
  L.push(
    "_Conta tarefas numeradas (`**T0.1**`), que é a régua do próprio doc 14. " +
      "Contar todos os checkboxes dá um número maior porque inclui as linhas de gate._",
  );
  L.push("");

  // --- Passivo -----------------------------------------------------------
  if (passivo.length) {
    L.push("## Passivo congelado");
    L.push("");
    L.push("| o quê | quanto | congelado desde |");
    L.push("|---|---|---|");
    for (const p of passivo) L.push(`| ${p.rotulo} | **${p.valor}** | ${p.desde} |`);
    L.push("");
    L.push("_Ratchets: o gate reprova se crescerem. Só encolhem com `--update`._");
    L.push("");
  }

  // --- Repositório -------------------------------------------------------
  L.push("## Repositório");
  L.push("");
  L.push(
    paresParaTabela([
      ["Migrations", String(migrations)],
      ["Rotas (`page.tsx`)", String(rotas)],
      ["Arquivos de teste", String(testes)],
      ["Primitivos de UI", String(primitivos)],
    ]),
  );
  L.push("");

  // --- Frescor das fontes (volátil: depende do histórico do git) ---------
  const fontes = [
    "CLAUDE.md",
    "README.md",
    "docs/Recruta64_Roadmap_Tecnico_v1.md",
    "docs/avatar/14-backlog-execucao.md",
    "docs/avatar/15-plano-ate-pronto.md",
    "docs/avatar/13-checklist-de-verificacao.md",
    "docs/curriculo/01-curriculo-definitivo-v1.md",
  ];
  L.push("## Frescor das fontes");
  L.push("");
  L.push(VOLATIL_INICIO);
  L.push("| doc | última edição |");
  L.push("|---|---|");
  for (const f of fontes) {
    const quando = existsSync(f) ? git("log", "-1", "--format=%ad", "--date=short", "--", f) : null;
    L.push(`| \`${f}\` | ${quando || "—"} |`);
  }
  L.push("");
  L.push("_Doc parado há semanas e ainda citado como fonte é candidato a `_superado/`._");
  L.push(VOLATIL_FIM);
  L.push("");

  return L.join("\n");
}

/** O bloco "Agora" do painel em disco, ou o texto padrão se ainda não existe. */
export function agoraAtual(): string {
  const atual = ler(PAINEL);
  if (!atual) return AGORA_PADRAO;
  const i = atual.indexOf(AGORA_INICIO);
  const f = atual.indexOf(AGORA_FIM);
  if (i === -1 || f === -1 || f < i) return AGORA_PADRAO;
  const corpo = atual.slice(i + AGORA_INICIO.length, f).trim();
  return corpo === "" ? AGORA_PADRAO : corpo;
}

/**
 * O painel sem as regiões voláteis — é isto que o gate compara.
 *
 * Num clone raso do CI não há `origin/main` nem histórico por arquivo, então
 * branch, contagem de commits e datas legitimamente diferem da máquina local.
 * Travar isso faria o gate reprovar sempre no CI e ninguém confiaria nele.
 */
export function semVolateis(painel: string): string {
  return painel
    .replace(
      new RegExp(`${VOLATIL_INICIO}[\\s\\S]*?${VOLATIL_FIM}`, "g"),
      `${VOLATIL_INICIO}${VOLATIL_FIM}`,
    )
    .trim();
}

function main() {
  const painel = gerarPainel(agoraAtual());
  writeFileSync(PAINEL, painel, "utf-8");
  console.log(`${PAINEL} — ${painel.split("\n").length} linhas`);
  console.log("O bloco Agora foi preservado. Todo o resto foi recontado.");
}

// Só escreve no disco quando ESTE arquivo é o ponto de entrada. É o que permite
// ao gate importar as funções acima e comparar em memória, sem efeito colateral.
// `realpathSync` nos dois lados porque no Windows o argv vem com barra invertida
// e a URL do módulo vem com barra normal — comparar as strings cruas nunca casa.
if (process.argv[1]) {
  try {
    if (realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
  } catch {
    // Caminho inacessível: não é o ponto de entrada, ou não dá para saber.
  }
}
