#!/usr/bin/env node
/**
 * Hook PreToolUse: impede editar uma migration que já foi commitada.
 *
 * A regra "NUNCA modificar uma migration já aplicada" é a única das quatro
 * regras invioláveis do CLAUDE.md que dependia inteiramente de o modelo
 * lembrar dela. Regra escrita é intenção; hook é garantia.
 *
 * CONTRATO — descoberto por evidência, não por documentação.
 * O Claude Code entrega o evento como JSON no **stdin**:
 *
 *   { "hook_event_name": "PreToolUse",
 *     "tool_name": "Edit",
 *     "cwd": "...",
 *     "tool_input": { "file_path": "..." } }
 *
 * O `docs/claude-code-guia.md` §6 propunha ler `$env:CLAUDE_TOOL_INPUT_FILE_PATH`
 * em PowerShell. Isso está errado em duas frentes: a variável não existe, e os
 * hooks desta máquina rodam em sh POSIX (o plugin impeccable, que comprovadamente
 * funciona aqui, é escrito em sh). Aquele hook nunca teria bloqueado nada — e um
 * hook que nunca bloqueia é indistinguível de um que funciona. Isso é "verde por
 * vacuidade", o defeito que este projeto já pagou duas vezes.
 *
 * FALHA FECHADA, de propósito. Se o stdin vier vazio ou o formato mudar, este
 * script BLOQUEIA em vez de deixar passar. O custo do falso positivo é você ver
 * a mensagem e remover o hook do settings.json em dez segundos. O custo do falso
 * negativo é uma migration aplicada ser editada em silêncio — que é como a curva
 * de XP rodou errada por 4 meses em produção.
 *
 * Saída 2 = bloqueado, com o motivo no stderr. Saída 0 = segue.
 */

import { execFileSync } from "node:child_process";

const BLOQUEADO = 2;
const SEGUE = 0;

function bloquear(motivo) {
  process.stderr.write(motivo + "\n");
  process.exit(BLOQUEADO);
}

let bruto = "";
try {
  if (!process.stdin.isTTY) {
    for await (const pedaco of process.stdin) bruto += pedaco;
  }
} catch {
  /* cai no bloqueio abaixo */
}

if (!bruto.trim()) {
  bloquear(
    "Hook bloqueia-migration-aplicada: stdin vazio — o contrato de hook mudou.\n" +
      "Este hook falha fechado de propósito. Conserte-o ou remova-o de " +
      ".claude/settings.json.",
  );
}

let evento;
try {
  evento = JSON.parse(bruto);
} catch {
  bloquear(
    "Hook bloqueia-migration-aplicada: stdin não é JSON — o contrato de hook mudou.\n" +
      "Este hook falha fechado de propósito. Conserte-o ou remova-o de " +
      ".claude/settings.json.",
  );
}

const entrada = evento?.tool_input;
if (!entrada || typeof entrada !== "object") {
  bloquear(
    "Hook bloqueia-migration-aplicada: evento sem `tool_input` — o contrato mudou.\n" +
      "Este hook falha fechado de propósito. Conserte-o ou remova-o de " +
      ".claude/settings.json.",
  );
}

// Cursor usa `path`, Claude Code usa `file_path`. Aceita os dois.
const caminho = entrada.file_path || entrada.path || "";
if (typeof caminho !== "string" || !caminho) process.exit(SEGUE);

// Windows manda `c:\...\supabase\migrations\x.sql`.
const normalizado = caminho.replace(/\\/g, "/");
const marca = normalizado.match(/(?:^|\/)(supabase\/migrations\/.+)$/);
if (!marca) process.exit(SEGUE);

const relativo = marca[1];
const raiz = typeof evento.cwd === "string" && evento.cwd ? evento.cwd : process.cwd();

let rastreada = false;
try {
  execFileSync("git", ["ls-files", "--error-unmatch", "--", relativo], {
    cwd: raiz,
    stdio: "ignore",
  });
  rastreada = true;
} catch {
  // Não rastreada pelo git = migration nova, ainda não commitada. Pode editar.
  rastreada = false;
}

if (rastreada) {
  bloquear(
    `BLOQUEADO: ${relativo} já está commitada.\n` +
      "O CLAUDE.md proíbe modificar migration já aplicada — a saída é criar uma " +
      "migration nova em supabase/migrations/YYYYMMDDHHMMSS_descricao.sql.",
  );
}

process.exit(SEGUE);
