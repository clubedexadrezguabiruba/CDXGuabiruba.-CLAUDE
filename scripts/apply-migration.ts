/**
 * Aplica uma migration SQL no Supabase remoto via conexão direta PostgreSQL.
 *
 * Uso:
 *   npx tsx scripts/apply-migration.ts supabase/migrations/20260216180500_auth_trigger.sql
 *
 * Requer SUPABASE_DB_URL no .env.local (connection string do pooler).
 */

import { existsSync, readFileSync } from "fs";
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
  console.error("Uso: npx tsx scripts/apply-migration.ts supabase/migrations/<arquivo.sql>");
  console.error("     (o caminho é resolvido a partir da raiz do projeto, não da pasta de migrations)");
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), migrationFile);

// O caminho é relativo à raiz, e a mensagem de uso já disse isso. Mas quem
// digita só o nome do arquivo recebia um ENOENT cru do Node, com stack trace e
// sem dica — custou uma rodada de verdade. Se o arquivo não está onde se pediu
// mas está em supabase/migrations/, a mensagem diz a linha certa para colar.
if (!existsSync(sqlPath)) {
  console.error(`Arquivo não encontrado: ${sqlPath}`);
  const provavel = resolve(process.cwd(), "supabase/migrations", migrationFile);
  if (existsSync(provavel)) {
    console.error("\nEle existe em supabase/migrations/. Rode assim:");
    console.error(`  npx tsx scripts/apply-migration.ts supabase/migrations/${migrationFile}`);
  }
  process.exit(1);
}

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
