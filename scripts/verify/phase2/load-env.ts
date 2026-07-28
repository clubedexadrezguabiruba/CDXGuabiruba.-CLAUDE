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

  // Aspas em volta do valor: acontece ao copiar de um .env para um secret de CI.
  // Uma aspa literal deixa a variável "presente" e o valor inválido, e o erro só
  // estoura lá dentro do supabase-js.
  for (const k of [...OBRIGATORIAS, "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_DB_URL"]) {
    const v = process.env[k];
    if (!v) continue;
    const t = v.trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      process.env[k] = t.slice(1, -1);
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

  validarUrlSupabase();
}

/**
 * Falha cedo e com diagnóstico se NEXT_PUBLIC_SUPABASE_URL não for uma URL.
 *
 * Sem isto, o valor errado só quebra lá dentro do supabase-js, com
 * "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL" e um stack trace de
 * node_modules — que não diz QUAL variável, nem o que há de errado com ela, nem
 * onde arrumar. Foi assim que o primeiro run do CI falhou.
 *
 * O diagnóstico descreve a FORMA do valor, nunca o valor: log de CI em
 * repositório público é leitura para qualquer um.
 */
function validarUrlSupabase(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  if (/^https?:\/\//i.test(url)) return;

  const pistas: string[] = [];
  if (url.startsWith("eyJ")) {
    pistas.push("parece uma chave JWT — provável troca com a ANON_KEY ou a SERVICE_ROLE_KEY");
  }
  if (url.includes("=")) {
    pistas.push('contém "=" — provável cópia da linha inteira, com o nome da variável junto');
  }
  if (url.includes("supabase.co") || url.includes("supabase.in")) {
    pistas.push('contém "supabase.co" mas sem protocolo — falta o "https://" na frente');
  }
  if (url.startsWith("postgres")) {
    pistas.push("é uma connection string do Postgres — esse valor pertence a SUPABASE_DB_URL");
  }

  console.error(
    `NEXT_PUBLIC_SUPABASE_URL inválida: precisa começar com https://\n` +
      `  formato recebido: ${url.length} caracteres, começa com "${url.slice(0, 4)}…"\n` +
      (pistas.length ? `  provável causa: ${pistas.join("; ")}\n` : "") +
      `  esperado: https://<project-ref>.supabase.co (Supabase → Settings → API → Project URL)`
  );
  process.exit(1);
}
