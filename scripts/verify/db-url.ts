/**
 * Helper: extrai a connection string PostgreSQL do .env.local.
 *
 * O .env.local guarda a URL numa linha solta (sem prefixo CHAVE=), então
 * loadEnv() não a expõe em process.env. Mesma leitura usada por
 * scripts/apply-migration.ts.
 *
 * SEGURANÇA: uso exclusivo em scripts locais e CI. Nunca importar no client.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

export function getDbUrl(): string {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf-8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("postgresql://") || trimmed.startsWith("postgres://")) {
      return trimmed;
    }
  }

  console.error("Connection string PostgreSQL não encontrada no .env.local");
  process.exit(1);
}
