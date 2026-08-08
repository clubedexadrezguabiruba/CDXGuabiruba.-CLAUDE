/**
 * GATE: o painel de estado, e os docs que contam gates errado
 *
 * O QUE ESTE GATE EXISTE PARA IMPEDIR
 * -----------------------------------
 * `scripts/estado.ts` gera `docs/ESTADO.md` recontando tudo do repositório. Isso
 * resolve o painel — e sozinho não resolve nada, porque o painel só é útil
 * enquanto alguém lembra de rodar `npm run estado`. Este gate é o "alguém".
 *
 * O histórico justifica a desconfiança. Duas vezes o projeto escreveu a lição e
 * duas vezes ela não pegou, porque o remédio foi prosa:
 *
 *   docs/avatar/14-backlog-execucao.md:427
 *     "número escrito à mão envelhece calado"
 *   .github/workflows/ci.yml:83
 *     "Sem contagem aqui de propósito: o número já apodreceu duas vezes."
 *
 * Quando este gate nasceu, a contagem de gates do `verify:all` aparecia escrita à
 * mão em quatro documentos vivos, com três valores diferentes (11, 11, 14) — e o
 * real era 15.
 *
 * AS TRÊS CONFERÊNCIAS
 * --------------------
 *   1. O painel está fresco — regenera em memória e compara com o disco.
 *   2. Nenhum doc vivo afirma um número de gates do `verify:all` diferente do que
 *      o `package.json` encadeia.
 *   3. A tabela-resumo do doc 14 bate com os próprios checkboxes do doc 14 —
 *      exatamente o erro que já aconteceu ali ("F0 — 13 fechadas", "total 64").
 *
 * O QUE ESTE GATE DE PROPÓSITO NÃO CONFERE
 * ----------------------------------------
 * As regiões `VOLATIL` do painel (branch, commits à frente, árvore suja, datas de
 * último commit). Num clone raso do CI não há `origin/main` nem histórico por
 * arquivo, então elas legitimamente diferem da máquina local. Travá-las faria o
 * gate reprovar sempre no CI, e gate que sempre reprova é gate que se desliga.
 *
 * Também não confere contagem de gate de OUTRA família — os 9 gates do
 * `avatar:garment`, por exemplo. O discriminador é proximidade textual de
 * `verify:all`; os números de uniforme não têm nenhum por perto.
 *
 * Roda offline, sem banco e sem rede.
 *
 * Uso: npm run verify:estado
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import {
  PAINEL,
  gerarPainel,
  agoraAtual,
  semVolateis,
  medirGates,
  contarNumeradas,
  porFase,
  medirCabelos,
} from "../../estado";

const violacoes: string[] = [];
const linhas: string[] = [];

function checar(ok: boolean, rotulo: string, detalhe: string) {
  linhas.push(`  [${ok ? "PASS" : "FAIL"}] ${rotulo} — ${detalhe}`);
  if (!ok) violacoes.push(`${rotulo} — ${detalhe}`);
}

function despejar() {
  console.log(linhas.join("\n"));
  linhas.length = 0;
}

function ler(caminho: string): string | null {
  try {
    return readFileSync(caminho, "utf-8");
  } catch {
    return null;
  }
}

/** Todo .md rastreável do projeto, fora de `_superado/` e de `node_modules`. */
function docsVivos(): string[] {
  const achados: string[] = [];
  function desce(dir: string) {
    let entradas;
    try {
      entradas = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entradas) {
      if (e.name === "node_modules" || e.name.startsWith(".") || e.name === "_superado") continue;
      const caminho = join(dir, e.name).replace(/\\/g, "/");
      if (e.isDirectory()) desce(caminho);
      else if (e.name.endsWith(".md")) achados.push(caminho);
    }
  }
  desce(".");
  return achados.sort();
}

/**
 * Contagens de gate atribuíveis ao `verify:all` num texto.
 *
 * São duas buscas, e a assimetria entre elas é deliberada:
 *
 *   (a) "N gates" numa janela de ±80 caracteres de `verify:all`. Larga porque a
 *       frase QUEBRA LINHA nos dois docs onde aparece ("14 gates\nno
 *       `verify:all`", "os 11 gates\n de `npm run verify:all`") — casar linha a
 *       linha não acharia nenhuma das duas.
 *
 *   (b) "roda N" e "N/N" numa janela CURTA e só PARA A FRENTE de `verify:all`.
 *       Estreita porque o doc 15 escreve "`verify:all` 14/14" na mesma linha que
 *       "e2e 149/149" — uma janela para trás leria 149 como contagem de gate e
 *       reprovaria por um número que está certo. Gate que acusa errado é pior
 *       que gate que não acusa: some a confiança nos dois casos.
 *
 * A janela de ±80 da forma (a) tem a mesma exposição em tese, mas na prática não:
 * "N gates" perto de `verify:all` só é escrito quando se fala dos gates dele.
 */
const JANELA_LARGA = 80;
const JANELA_CURTA = 30;

function contagensDeGate(texto: string): Array<{ numero: number; trecho: string }> {
  const achados: Array<{ numero: number; trecho: string }> = [];

  // (a) "N gates" com `verify:all` por perto, em qualquer direção.
  for (const m of texto.matchAll(/(\d+)\s+gates?\b/g)) {
    const i = m.index ?? 0;
    const vizinhanca = texto.slice(Math.max(0, i - JANELA_LARGA), i + m[0].length + JANELA_LARGA);
    if (!vizinhanca.includes("verify:all")) continue;
    achados.push({ numero: Number(m[1]), trecho: m[0].replace(/\s+/g, " ") });
  }

  // (b) número logo DEPOIS de `verify:all`, nas duas formas que o doc 15 usa.
  for (const m of texto.matchAll(/verify:all`?/g)) {
    const depois = texto.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + JANELA_CURTA);
    const roda = depois.match(/^\s*roda\s+\*{0,2}(\d+)/);
    if (roda) achados.push({ numero: Number(roda[1]), trecho: `verify:all roda ${roda[1]}` });
    const fracao = depois.match(/^\W{0,3}(\d+)\s*\/\s*(\d+)\b/);
    if (fracao && fracao[1] === fracao[2]) {
      achados.push({ numero: Number(fracao[1]), trecho: `verify:all ${fracao[1]}/${fracao[2]}` });
    }
  }

  return achados;
}

function main() {
  console.log("========================================");
  console.log("GATE: o painel de estado");
  console.log("========================================\n");

  // -------------------------------------------------------------------------
  // 1. O painel está fresco?
  // -------------------------------------------------------------------------
  console.log("1. O painel bate com o repositório\n");

  const emDisco = ler(PAINEL);
  checar(emDisco !== null, `${PAINEL} existe`, emDisco === null ? "não existe — rode `npm run estado`" : "sim");

  if (emDisco !== null) {
    const esperado = gerarPainel(agoraAtual());
    const igual = semVolateis(esperado) === semVolateis(emDisco);
    checar(
      igual,
      "painel em dia",
      igual
        ? "as contagens do arquivo batem com o repositório"
        : "DESATUALIZADO ou editado à mão — rode `npm run estado` e commite",
    );
  }
  despejar();

  // -------------------------------------------------------------------------
  // 2. Algum doc vivo conta os gates do verify:all à mão?
  // -------------------------------------------------------------------------
  console.log("\n2. Contagem de gates escrita à mão nos docs\n");

  const pkg = ler("package.json");
  const gates = pkg ? medirGates(pkg) : { entradas: [], folhas: [] };
  const certos = new Set([gates.entradas.length, gates.folhas.length]);

  let achouAlgum = false;
  for (const doc of docsVivos()) {
    if (doc.endsWith(PAINEL)) continue; // o painel é gerado; ele é a régua
    const texto = ler(doc);
    if (!texto) continue;
    for (const { numero, trecho } of contagensDeGate(texto)) {
      achouAlgum = true;
      checar(
        certos.has(numero),
        doc,
        `"${trecho}" perto de \`verify:all\` — hoje são ${gates.entradas.length} entradas / ${gates.folhas.length} scripts`,
      );
    }
  }
  if (!achouAlgum) {
    checar(true, "nenhum doc conta gates à mão", `a régua é o package.json (${gates.entradas.length} entradas)`);
  }
  despejar();

  // -------------------------------------------------------------------------
  // 3. O doc 14 concorda consigo mesmo?
  //
  //    A tabela-resumo já mentiu uma vez ("F0 — 13 fechadas", "total 64"). Ela é
  //    escrita à mão de propósito — traz coluna de julgamento ("depende de
  //    você?") que script nenhum deriva —, então o que se automatiza é a
  //    conferência, não a escrita.
  // -------------------------------------------------------------------------
  console.log("\n3. A tabela-resumo do doc 14 contra os próprios checkboxes\n");

  const DOC14 = "docs/avatar/14-backlog-execucao.md";
  const doc14 = ler(DOC14);

  if (!doc14) {
    checar(false, DOC14, "não consegui ler");
  } else {
    const medido = new Map(porFase(doc14).map((f) => [f.fase, f.c]));
    const total = contarNumeradas(doc14);

    const linhasTabela = doc14
      .split("\n")
      .filter((l) => /^\|\s*(\*\*)?(F\d|total)/i.test(l.trim()))
      .map((l) => l.split("|").slice(1, -1).map((c) => c.trim().replace(/\*\*/g, "")));

    checar(linhasTabela.length > 0, "tabela-resumo encontrada", `${linhasTabela.length} linhas`);

    for (const c of linhasTabela) {
      const rotulo = (c[0] ?? "").toLowerCase();
      const declaradoTotal = Number((c[1] ?? "").replace(/\D/g, ""));
      // "25 (38%)" → 25: só o primeiro número da célula.
      const declaradoFechadas = Number((c[2] ?? "").match(/\d+/)?.[0]);
      if (!Number.isFinite(declaradoTotal) || !Number.isFinite(declaradoFechadas)) continue;

      const real = rotulo === "total" ? total : medido.get((c[0] ?? "").toUpperCase());
      if (!real) {
        checar(false, `doc 14, linha "${c[0]}"`, "fase não encontrada no corpo do documento");
        continue;
      }
      const ok = declaradoTotal === real.total && declaradoFechadas === real.fechadas;
      checar(
        ok,
        `doc 14, ${c[0]}`,
        ok
          ? `${real.fechadas}/${real.total} confere`
          : `tabela diz ${declaradoFechadas}/${declaradoTotal}, checkboxes dizem ${real.fechadas}/${real.total}`,
      );
    }
  }
  despejar();

  // -------------------------------------------------------------------------
  // 4. A CONTAGEM DE CABELO NÃO PODE SER VÁCUA
  //
  // `medirCabelos` lê a união `ModeloCabelo` por regex. O modo de falha dela não
  // é errar o número — é **devolver 0 calada** no dia em que alguém reformatar a
  // declaração do tipo, e o painel passar a anunciar "0 de 10" como se o
  // catálogo tivesse sumido. É a vacuidade que este projeto já pagou duas vezes.
  //
  // O piso é 5: são os paramétricos, e eles estão congelados por selo em
  // `MODELOS_PARAMETRICOS`. Menos que isso não é catálogo encolhendo, é a régua
  // quebrada.
  // -------------------------------------------------------------------------
  console.log("\n4. A régua do catálogo de cabelo enxerga alguma coisa\n");

  const cabelos = medirCabelos(ler("src/lib/avatar/estilo/cabelo.ts"));
  checar(
    cabelos.tem >= 5,
    "medirCabelos não é vácua",
    cabelos.tem >= 5
      ? `${cabelos.tem} modelos na união \`ModeloCabelo\` (mínimo encomendado: ${cabelos.minimo})`
      : `contou ${cabelos.tem} — abaixo dos 5 paramétricos congelados. O regex da união parou de casar`,
  );
  despejar();

  // -------------------------------------------------------------------------
  console.log("\n========================================");
  if (violacoes.length === 0) {
    console.log("RESULTADO: 0 violações");
    console.log("========================================");
    return;
  }
  console.log(`RESULTADO: ${violacoes.length} violações`);
  console.log("========================================\n");
  for (const v of violacoes) console.log(`  - ${v}`);
  console.log("");
  process.exit(1);
}

main();
