/**
 * GATE ANTI-DUPLICAÇÃO DE FUNÇÃO SQL (ratchet)
 *
 * O problema que este gate existe para impedir:
 *
 *   puzzle_attempt está definida por inteiro 12 vezes em 12 migrations.
 *   grant_xp, 9 vezes. A migration 20260217100000 se declara "a única fonte
 *   da verdade daqui pra frente" e foi sobrescrita sete vezes depois.
 *
 *   Consequência real: em 16/03 a curva de XP foi mudada de 1.05 para 1.08
 *   deliberadamente; em 17/03 uma migration de outro assunto recolou um corpo
 *   antigo de grant_xp e reverteu a mudança em silêncio. Ficou 4 meses assim.
 *
 * O gate é um RATCHET, não uma limpeza retroativa: congela a contagem atual
 * como baseline (rpc-baseline.json) e falha se qualquer função passar a ser
 * redefinida MAIS vezes que hoje. Ou seja: o legado é aceito, o crescimento não.
 *
 * Quando você precisar legitimamente redefinir uma função:
 *   1. Prefira migrar a lógica para um helper chamado por ela (não recolar).
 *   2. Se recolar for inevitável, rode com --update para subir o baseline
 *      e explique o motivo na mensagem do commit.
 *
 * Uso: npm run verify:no-dup-rpc          (checa)
 *      npm run verify:no-dup-rpc -- --update  (regrava o baseline)
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, join } from "path";

const MIGRATIONS_DIR = "supabase/migrations";
const BASELINE_PATH = "scripts/verify/security/rpc-baseline.json";

/** Conta definições completas de função por nome nas migrations. */
function contarDefinicoes(): Record<string, number> {
  const dir = resolve(process.cwd(), MIGRATIONS_DIR);
  const counts: Record<string, number> = {};

  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
    const src = readFileSync(join(dir, file), "utf-8");
    const re = /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(?:public\.)?([a-z_0-9]+)/gi;
    for (const m of src.matchAll(re)) {
      const nome = m[1].toLowerCase();
      counts[nome] = (counts[nome] || 0) + 1;
    }
  }

  return counts;
}

function main() {
  const atual = contarDefinicoes();
  const args = process.argv.slice(2);

  if (args.includes("--update")) {
    const ordenado = Object.fromEntries(
      Object.entries(atual).sort((a, b) => b[1] - a[1])
    );
    writeFileSync(resolve(process.cwd(), BASELINE_PATH), JSON.stringify(ordenado, null, 2));
    console.log(`Baseline regravado: ${Object.keys(atual).length} funções.`);
    console.log("Explique no commit por que a redefinição foi necessária.");
    return;
  }

  const baseline: Record<string, number> = JSON.parse(
    readFileSync(resolve(process.cwd(), BASELINE_PATH), "utf-8")
  );

  console.log("========================================");
  console.log("GATE: redefinição de função SQL (ratchet)");
  console.log("========================================");

  const violacoes: string[] = [];
  const novas: string[] = [];

  for (const [nome, count] of Object.entries(atual)) {
    const limite = baseline[nome];

    if (limite === undefined) {
      // Função nova: 1 definição é o esperado.
      if (count > 1) {
        novas.push(`${nome}: função nova já com ${count} definições`);
      }
      continue;
    }

    if (count > limite) {
      violacoes.push(`${nome}: ${count} definições (baseline ${limite}, +${count - limite})`);
    }
  }

  const totalDefs = Object.values(atual).reduce((s, c) => s + c, 0);
  const redefinidas = Object.entries(atual).filter(([, c]) => c > 1);

  console.log(`\nEstado: ${Object.keys(atual).length} funções | ${totalDefs} definições`);
  console.log(`Redefinidas mais de uma vez: ${redefinidas.length}`);

  const piores = redefinidas.sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (piores.length > 0) {
    console.log("\nDívida herdada (congelada no baseline, não cresce mais):");
    for (const [nome, c] of piores) console.log(`  ${nome}: ${c}x`);
  }

  if (violacoes.length > 0 || novas.length > 0) {
    console.log("\n--- VIOLAÇÕES ---");
    for (const v of violacoes) console.log(`  [FAIL] ${v}`);
    for (const n of novas) console.log(`  [FAIL] ${n}`);
    console.log("\nRecolar o corpo inteiro de uma função é como a curva de XP foi");
    console.log("revertida em silêncio. Extraia um helper, ou rode com --update");
    console.log("e justifique no commit.");
    console.log("\n========================================");
    console.log(`RESULTADO: ${violacoes.length + novas.length} violações`);
    console.log("========================================");
    process.exit(1);
  }

  console.log("\n  [PASS] Nenhuma função redefinida além do baseline");
  console.log("\n========================================");
  console.log("RESULTADO: 0 violações");
  console.log("========================================");
  console.log("\nGate anti-duplicação: OK");
}

main();
