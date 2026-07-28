/**
 * Helper: carrega variáveis de .env.local para process.env.
 * Compartilhado entre scripts de validação.
 *
 * Em CI não existe .env.local — as variáveis vêm de secrets já exportados no
 * ambiente. Por isso a ausência do arquivo NÃO é erro: só falha se, além de não
 * haver arquivo, as variáveis obrigatórias também não estiverem em process.env.
 *
 * Variáveis já presentes em process.env têm precedência sobre o arquivo, para
 * que um override pontual no shell funcione sem editar o .env.local.
 *
 * SEGURANÇA: este helper pode carregar SUPABASE_SERVICE_ROLE_KEY.
 * NUNCA importe este módulo em código client/browser.
 * Uso exclusivo: scripts locais e CI.
 */

import * as fs from "fs";
import * as path from "path";

/** Variáveis sem as quais nenhum gate que usa este helper consegue rodar. */
const OBRIGATORIAS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");

  if (fs.existsSync(envPath)) {
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
      // Ambiente vence arquivo: em CI as variáveis já vêm de secrets.
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }

  const faltando = OBRIGATORIAS.filter((k) => !process.env[k]);
  if (faltando.length > 0) {
    console.error(
      `Variáveis de ambiente ausentes: ${faltando.join(", ")}.\n` +
        `Defina-as no ambiente (CI) ou crie um .env.local na raiz do projeto.`
    );
    process.exit(1);
  }
}
