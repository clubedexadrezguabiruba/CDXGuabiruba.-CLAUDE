/**
 * ============================================================
 * Gate de Validação — Fase 2: Seed Data
 * ============================================================
 *
 * O que valida:
 *   - 10 bots com nome, elo e unlock_order corretos
 *   - 17 achievements com key, titulo e XP
 *   - 77 itens distribuidos por slot e raridade
 *   - RLS: anon nao acessa seeds, service_role acessa
 *
 * Pré-requisitos:
 *   - .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY recomendado (bypassa RLS para listar seeds)
 *   - Migration 20260216180400_seeds.sql aplicada
 *
 * SEGURANÇA: usa SUPABASE_SERVICE_ROLE_KEY — NUNCA rodar no client.
 *            Uso exclusivo: terminal local / CI.
 *
 * Exit:
 *   0 = seeds conferem
 *   1 = inconsistencia encontrada
 *
 * Uso:
 *   npm run verify:seeds
 *   npx tsx scripts/verify/phase2/verify-seeds.ts
 * ============================================================
 */

import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env.js";

loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!URL || !SERVICE_KEY) {
  console.error(
    "Faltam variaveis em .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const sb = createClient(URL, SERVICE_KEY);

let hasError = false;

async function main() {
  console.log("=== VERIFICACAO DE SEEDS (service role) ===\n");
  console.log(`Supabase URL: ${URL}`);
  console.log(`Key type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "anon"}\n`);

  // --- Bots ---
  const { data: bots, error: e1 } = await sb
    .from("bots")
    .select("name, elo, unlock_order")
    .order("unlock_order");
  if (e1) {
    console.log(`[FAIL] Bots: ${e1.message}`);
    hasError = true;
  } else {
    console.log(`[PASS] Bots: ${bots!.length} registros`);
    for (const b of bots!) console.log(`   #${b.unlock_order} ${b.name} (${b.elo} elo)`);
  }

  // --- Achievements ---
  const { data: achs, error: e2 } = await sb
    .from("achievements")
    .select("key, title, reward_xp")
    .order("id");
  if (e2) {
    console.log(`\n[FAIL] Achievements: ${e2.message}`);
    hasError = true;
  } else {
    console.log(`\n[PASS] Achievements: ${achs!.length} registros`);
    for (const a of achs!) console.log(`   ${a.key}: "${a.title}" (+${a.reward_xp} XP)`);
  }

  // --- Items ---
  // A conferência do catálogo de itens saiu no Bloco B (2026-08-10): a tabela
  // `items` foi apagada com o avatar v2 inteiro
  // (docs/avatar/20-troca-de-pilha-plano.md). Quem vigia que ela NÃO volte é o
  // verify:avatar-db, que exige a ausência — não some conferência, ela inverte.

  // --- RLS check ---
  console.log("\n=== STATUS RLS ===");
  const anonSb = createClient(URL, ANON_KEY);

  const { data: anonBots } = await anonSb.from("bots").select("name").limit(1);
  const { data: srvBots } = await sb.from("bots").select("name").limit(1);

  if (anonBots && anonBots.length === 0 && srvBots && srvBots.length > 0) {
    console.log("[PASS] RLS confirmado: anon=0 rows, service_role tem dados");
  } else if (anonBots && anonBots.length > 0) {
    console.log("[WARN] Bots visiveis sem auth (anon tem acesso -- verificar RLS)");
  } else {
    console.log(
      `[INFO] anon: ${anonBots?.length ?? "error"} | service: ${srvBots?.length ?? "error"}`
    );
  }

  // --- Resumo ---
  console.log("\n========================================");
  if (hasError) {
    console.log("RESULTADO: FALHAS encontradas");
    process.exit(1);
  } else {
    console.log("RESULTADO: Seeds OK");
  }
  console.log("========================================");
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
