/**
 * Helper: carrega variáveis de .env.local para process.env.
 * Compartilhado entre scripts de validação.
 *
 * SEGURANÇA: este helper pode carregar SUPABASE_SERVICE_ROLE_KEY.
 * NUNCA importe este módulo em código client/browser.
 * Uso exclusivo: scripts locais e CI.
 */

import * as fs from "fs";
import * as path from "path";

export function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Arquivo .env.local não encontrado na raiz do projeto.");
    process.exit(1);
  }

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
