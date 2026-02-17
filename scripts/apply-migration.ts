/**
 * Aplica uma migration SQL no Supabase remoto via conexão direta PostgreSQL.
 *
 * Uso:
 *   npx tsx scripts/apply-migration.ts supabase/migrations/20260216180500_auth_trigger.sql
 *
 * Requer SUPABASE_DB_URL no .env.local (connection string do pooler).
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import postgres from "postgres";

// Carrega .env.local
const envPath = resolve(import.meta.dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
let dbUrl = "";

for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("postgresql://") || trimmed.startsWith("postgres://")) {
    dbUrl = trimmed;
    break;
  }
}

if (!dbUrl) {
  console.error("Erro: connection string PostgreSQL não encontrada no .env.local");
  console.error("Adicione a URL no formato: postgresql://user:pass@host:port/db");
  process.exit(1);
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error("Uso: npx tsx scripts/apply-migration.ts <arquivo.sql>");
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), migrationFile);
const sql = readFileSync(sqlPath, "utf-8");

console.log(`\nAplicando migration: ${migrationFile}`);
console.log(`DB: ${dbUrl.replace(/:[^:@]+@/, ":****@")}`);
console.log("---");

const db = postgres(dbUrl, { ssl: "require" });

try {
  await db.unsafe(sql);
  console.log("Migration aplicada com sucesso!");
} catch (err) {
  console.error("Erro ao aplicar migration:", err);
  process.exit(1);
} finally {
  await db.end();
}
