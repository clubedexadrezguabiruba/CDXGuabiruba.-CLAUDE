/**
 * Helper: resolve a connection string PostgreSQL usada pelos gates de banco.
 *
 * Ordem de precedência:
 *   1. process.env.SUPABASE_DB_URL  — é assim que o CI fornece (secret).
 *   2. .env.local na raiz           — é assim que a máquina local fornece.
 *
 * O .env.local guarda a URL numa **linha solta, sem prefixo CHAVE=**, então
 * loadEnv() não a expõe em process.env e a leitura aqui varre o arquivo
 * procurando por postgres://. Mesma leitura usada por scripts/apply-migration.ts.
 *
 * SEGURANÇA: uso exclusivo em scripts locais e CI. Nunca importar no client.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/**
 * Remove aspas em volta do valor.
 *
 * Copiar de um arquivo .env para um secret de CI leva as aspas junto, e uma
 * aspa literal deixa a variável "presente" com valor inválido — o postgres()
 * então falha com erro de parsing longe da causa. loadEnv() faz o mesmo; os
 * gates de banco chamam getDbUrl() sem passar por ele.
 */
function semAspas(v: string | undefined): string | undefined {
  if (!v) return v;
  const aspado =
    (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"));
  return aspado ? v.slice(1, -1) : v;
}

export function getDbUrl(): string {
  const fromEnv = semAspas(process.env.SUPABASE_DB_URL?.trim());
  if (fromEnv) return fromEnv;

  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("postgresql://") || trimmed.startsWith("postgres://")) {
        return trimmed;
      }
    }
  }

  console.error(
    "Connection string PostgreSQL não encontrada.\n" +
      "Defina SUPABASE_DB_URL no ambiente (CI) ou inclua a URL postgres:// no .env.local."
  );
  process.exit(1);
}
