/**
 * GATE: o client não devolve a solução do puzzle ao servidor
 *
 * O bug que este gate impede de voltar:
 *
 *   puzzle_attempt valida com `v_solved := (p_moves = v_correct_moves)`.
 *   Os 4 call sites mandavam, no caminho de sucesso,
 *   `p_moves: result.solved ? allMoves : result.movesPlayed`
 *   onde `allMoves = parsePuzzleMoves(puzzle.moves)` — isto é, a própria
 *   solução que o servidor acabou de enviar. A validação virava
 *   "o client consegue repetir a string que recebeu?".
 *
 * LIMITE CONHECIDO (honestidade sobre o que este gate NÃO resolve):
 *   o client precisa da solução para validar lances localmente e animar o
 *   oponente, então `puzzles.moves` chega ao browser. Um cheater determinado
 *   ainda pode ler a solução e forjar o array. Fechar isso de vez exige que
 *   o servidor entregue um lance por vez, em vez da linha completa — mudança
 *   de arquitetura, registrada como pendência, não feita aqui.
 *   O que este gate garante: a validação deixou de ser tautológica por
 *   acidente, e não volta a ser.
 *
 * Uso: npm run verify:puzzle-authority
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { resolve, join } from "path";

const PUZZLES_DIR = "src/app/(main)/puzzles";
const TESTE_INVARIANTE = "src/lib/chess/__tests__/puzzleMovesInvariant.test.ts";

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

/** Lista recursivamente arquivos .tsx/.ts sob um diretório. */
function listarArquivos(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listarArquivos(full));
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

function main() {
  console.log("========================================");
  console.log("GATE: server-authority dos puzzles");
  console.log("========================================");

  const dir = resolve(process.cwd(), PUZZLES_DIR);
  const arquivos = listarArquivos(dir);

  // --- 1. todo p_moves recebe os lances realmente jogados ---
  console.log("\n1. p_moves envia movesPlayed");

  let sitesEncontrados = 0;

  for (const file of arquivos) {
    const src = readFileSync(file, "utf-8");
    const rel = file.slice(file.indexOf("src"));

    for (const m of src.matchAll(/p_moves:\s*([^,\n]+)/g)) {
      const valor = m[1].trim();
      sitesEncontrados++;

      if (/\bstring\[\]/.test(valor)) continue; // declaração de tipo, não chamada

      if (!/\.movesPlayed\b/.test(valor)) {
        nok(`${rel}: p_moves não envia movesPlayed`, `valor: ${valor}`);
      } else if (/\?|:/.test(valor.replace(/\?\./g, ""))) {
        nok(
          `${rel}: p_moves com condicional`,
          `envie sempre os lances jogados — valor: ${valor}`
        );
      } else {
        ok(`${rel}: p_moves = ${valor}`);
      }
    }
  }

  if (sitesEncontrados === 0) {
    nok("Call sites de puzzle_attempt", "nenhum p_moves encontrado — o gate perdeu o alvo?");
  }

  // --- 2. nenhuma página de puzzle deriva a solução para enviar ---
  console.log("\n2. Nenhuma página de puzzle usa parsePuzzleMoves");

  for (const file of arquivos) {
    const src = readFileSync(file, "utf-8");
    const rel = file.slice(file.indexOf("src"));

    if (src.includes("parsePuzzleMoves") && src.includes("p_moves")) {
      nok(
        `${rel} deriva a solução e chama puzzle_attempt`,
        "risco de reintroduzir a validação tautológica"
      );
    }
  }

  if (failed === 0) ok("Nenhuma página combina parsePuzzleMoves + p_moves");

  // --- 3. o teste de invariante existe (protege a mudança) ---
  console.log("\n3. Teste de invariante presente");

  const testePath = resolve(process.cwd(), TESTE_INVARIANTE);
  if (!existsSync(testePath)) {
    nok("Teste de invariante", `${TESTE_INVARIANTE} não existe`);
  } else {
    const t = readFileSync(testePath, "utf-8");
    const fixtures = resolve(
      process.cwd(),
      "src/lib/chess/__tests__/fixtures/puzzle-solutions.json"
    );
    if (!existsSync(fixtures)) {
      nok("Fixtures do teste de invariante", "puzzle-solutions.json não existe");
    } else {
      const n = JSON.parse(readFileSync(fixtures, "utf-8")).length;
      if (n < 300) nok("Fixtures insuficientes", `${n} puzzles (esperado 300+)`);
      else if (!t.includes("movesPlayed")) nok("Teste de invariante", "não cobre movesPlayed");
      else ok(`Invariante coberta por ${n} puzzles reais`);
    }
  }

  console.log("\n========================================");
  console.log(`RESULTADO: ${passed} passed | ${failed} failed`);
  console.log("========================================");

  if (failed > 0) process.exit(1);
  console.log("\nGate de server-authority dos puzzles: OK");
  console.log("Limite conhecido: puzzles.moves ainda chega ao browser (ver docstring).");
}

main();
