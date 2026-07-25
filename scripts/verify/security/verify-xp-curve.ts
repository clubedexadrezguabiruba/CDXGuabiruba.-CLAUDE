/**
 * GATE DA CURVA DE XP
 *
 * Existe por causa de um bug real: a migration 20260316200000_rebalance_xp.sql
 * mudou a curva de 1.05 para 1.08 deliberadamente. No dia seguinte,
 * 20260317100000_duplicate_item_to_xp.sql recolou um corpo antigo de grant_xp
 * com 1.05, e 20260319100000_egg_hatching_system.sql repetiu. Produção voltou
 * a 1.05 e ninguém notou por 4 meses, porque a fórmula estava duplicada em 3
 * componentes do client (todos com 1.05) — a UI concordava com o bug.
 *
 * Este gate compara a constante única do client (src/lib/gamification/xp.ts)
 * com o corpo das funções em PRODUÇÃO, e falha se divergirem.
 *
 * Uso: npm run verify:xp-curve
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import postgres from "postgres";
import { getDbUrl } from "../db-url";

/** Funções no banco que calculam XP por nível. */
const FUNCOES_COM_CURVA = ["grant_xp", "check_level_up"];

/**
 * Pool de missões diárias conforme especificado.
 *
 * docs/Recruta64_Visao_do_Produto_v1.md:292-295 calibra
 * "Dedicado (5 missões/dia) → ~300 XP/dia". Estes 20 valores entregam
 * 303 XP/dia com 5 missões — é a calibração de origem.
 *
 * Histórico: 20260316200000_rebalance_xp.sql cortou todos em ~35% para
 * compensar uma curva 1.08 que o spec nunca pediu (e que tornava o nível 100
 * inalcançável). A curva foi revertida por acidente e o corte ficou, deixando
 * o sistema 30% abaixo da própria especificação por 4 meses.
 * Restaurado por 20260725140000_restaurar_xp_missoes.sql.
 *
 * Se um rebalanceamento futuro for deliberado, mude AQUI junto com a migration.
 */
const POOL_ESPECIFICADO: Record<string, number> = {
  solve_3_rating: 40,
  solve_5_rating: 50,
  solve_10_rating: 80,
  complete_1_lesson: 60,
  complete_2_lessons: 80,
  defeat_1_bot: 70,
  defeat_2_bots: 100,
  streak_3_puzzles: 50,
  streak_5_puzzles: 70,
  do_1_rush: 50,
  do_2_rush: 70,
  solve_3_category: 40,
  solve_5_category: 50,
  rush_5_correct: 60,
  rush_10_correct: 80,
  solve_1_mate2: 50,
  solve_1_fork: 50,
  solve_1_pin: 50,
  solve_3_revanche: 60,
  solve_1_endgame: 50,
};

/** Meta de XP/dia do doc para aluno dedicado (5 missões). */
const XP_DIA_DEDICADO_ALVO = 300;
const XP_DIA_TOLERANCIA = 25;

let passed = 0;
let failed = 0;

function ok(msg: string) {
  console.log(`  [PASS] ${msg}`);
  passed++;
}

function nok(msg: string, detail: string) {
  console.log(`  [FAIL] ${msg} -- ${detail}`);
  failed++;
}

/** Lê XP_GROWTH_FACTOR e XP_BASE da fonte única do client. */
function lerConstantesDoClient(): { factor: number; base: number } {
  const src = readFileSync(
    resolve(process.cwd(), "src/lib/gamification/xp.ts"),
    "utf-8"
  );

  const mFactor = src.match(/XP_GROWTH_FACTOR\s*=\s*([\d.]+)/);
  const mBase = src.match(/XP_BASE\s*=\s*([\d.]+)/);

  if (!mFactor || !mBase) {
    console.error("Não achei XP_GROWTH_FACTOR/XP_BASE em src/lib/gamification/xp.ts");
    process.exit(1);
  }

  return { factor: parseFloat(mFactor[1]), base: parseFloat(mBase[1]) };
}

async function main() {
  const { factor, base } = lerConstantesDoClient();

  console.log("========================================");
  console.log("GATE: curva de XP (client x produção)");
  console.log("========================================");
  console.log(`\nFonte única do client: ${base} * ${factor}^(N-1)`);

  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  try {
    // --- 1. curva no banco ---
    console.log("\n1. Curva nas funções em produção");

    const rows = await sql<{ proname: string; prosrc: string }[]>`
      select p.proname, p.prosrc
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = any(${FUNCOES_COM_CURVA})`;

    const encontradas = new Set(rows.map((r) => r.proname));
    for (const nome of FUNCOES_COM_CURVA) {
      if (!encontradas.has(nome)) nok(`Função ${nome}`, "não existe no banco");
    }

    for (const r of rows) {
      const fatores = [...r.prosrc.matchAll(/power\(\s*([\d.]+)\s*,/g)].map((m) =>
        parseFloat(m[1])
      );

      if (fatores.length === 0) {
        console.log(`  [SKIP] ${r.proname}: não calcula curva de XP`);
        continue;
      }

      const distintos = [...new Set(fatores)];
      if (distintos.length > 1) {
        nok(`${r.proname} usa fatores inconsistentes`, `encontrados: ${distintos.join(", ")}`);
      } else if (distintos[0] !== factor) {
        nok(
          `${r.proname} divergiu da fonte única`,
          `produção usa power(${distintos[0]}), client declara ${factor}`
        );
      } else {
        ok(`${r.proname}: power(${distintos[0]}) — bate com o client`);
      }
    }

    // --- 2. base do nível 1 ---
    console.log("\n2. XP base do nível 1");

    for (const r of rows) {
      const bases = [...r.prosrc.matchAll(/round\(\s*([\d.]+)\s*\*\s*power\(/g)].map((m) =>
        parseFloat(m[1])
      );
      if (bases.length === 0) continue;

      const distintos = [...new Set(bases)];
      if (distintos.length > 1 || distintos[0] !== base) {
        nok(`${r.proname} base divergente`, `produção: ${distintos.join(", ")} | client: ${base}`);
      } else {
        ok(`${r.proname}: base ${distintos[0]} — bate com o client`);
      }
    }

    // --- 3. pool de missões bate com o especificado ---
    console.log("\n3. Pool de missões diárias x especificação");

    const cdm = await sql<{ prosrc: string }[]>`
      select p.prosrc
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'check_daily_missions'`;

    if (cdm.length === 0) {
      nok("check_daily_missions", "não existe no banco");
    } else {
      const encontrado = new Map<string, number>();
      const re = /ARRAY\['([a-z_0-9]+)',\s*'[^']*',\s*'\d+',\s*'(\d+)'/g;
      for (const m of cdm[0].prosrc.matchAll(re)) {
        encontrado.set(m[1], Number(m[2]));
      }

      if (encontrado.size === 0) {
        nok("Pool de missões", "não consegui extrair o pool de check_daily_missions");
      } else {
        const divergentes: string[] = [];
        const faltando: string[] = [];

        for (const [key, esperado] of Object.entries(POOL_ESPECIFICADO)) {
          const atual = encontrado.get(key);
          if (atual === undefined) faltando.push(key);
          else if (atual !== esperado) divergentes.push(`${key}: ${atual} (esperado ${esperado})`);
        }

        const extras = [...encontrado.keys()].filter((k) => !(k in POOL_ESPECIFICADO));

        if (faltando.length > 0) nok("Missões ausentes do pool", faltando.join(", "));
        if (extras.length > 0) nok("Missões não especificadas no pool", extras.join(", "));
        if (divergentes.length > 0) {
          nok("Pool divergiu da especificação", divergentes.join(" | "));
        }
        if (faltando.length === 0 && extras.length === 0 && divergentes.length === 0) {
          ok(`Pool com ${encontrado.size} missões, todas conforme especificado`);
        }

        // XP/dia derivado, contra a meta do doc
        const soma = [...encontrado.values()].reduce((s, v) => s + v, 0);
        const xpDia = Math.round((soma / encontrado.size) * 5);
        const delta = Math.abs(xpDia - XP_DIA_DEDICADO_ALVO);

        if (delta > XP_DIA_TOLERANCIA) {
          nok(
            "XP/dia do aluno dedicado fora da meta",
            `${xpDia} XP/dia (doc calibra ~${XP_DIA_DEDICADO_ALVO}, tolerância ±${XP_DIA_TOLERANCIA})`
          );
        } else {
          ok(`XP/dia com 5 missões: ${xpDia} (meta do doc: ~${XP_DIA_DEDICADO_ALVO})`);
        }
      }
    }

    // --- 4. nenhuma duplicação da fórmula no client ---
    console.log("\n4. Fórmula não reimplementada no client");

    const { execSync } = await import("child_process");
    let duplicatas: string[] = [];
    try {
      const out = execSync(
        `git grep -n "Math.pow(1\\." -- "src/**/*.ts" "src/**/*.tsx"`,
        { encoding: "utf-8" }
      );
      duplicatas = out
        .split("\n")
        .filter((l) => l.trim() && !l.includes("src/lib/gamification/xp.ts"));
    } catch {
      // git grep sai com 1 quando não há match — é o caso bom
    }

    if (duplicatas.length > 0) {
      nok(
        "Fórmula de XP duplicada no client",
        `use xpForLevel() de @/lib/gamification/xp:\n      ${duplicatas.join("\n      ")}`
      );
    } else {
      ok("Nenhuma reimplementação de Math.pow(1.x) fora da fonte única");
    }
  } finally {
    await sql.end();
  }

  console.log("\n========================================");
  console.log(`RESULTADO: ${passed} passed | ${failed} failed`);
  console.log("========================================");

  if (failed > 0) process.exit(1);
  console.log("\nGate da curva de XP: OK");
}

main().catch((e) => {
  console.error("Erro no gate:", e.message);
  process.exit(1);
});
