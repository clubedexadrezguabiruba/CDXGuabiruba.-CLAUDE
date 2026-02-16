/**
 * Script para importar puzzles do CSV público do Lichess para o Supabase.
 *
 * Uso:
 *   npx tsx scripts/import-puzzles.ts ./lichess_db_puzzle.csv
 *   npx tsx scripts/import-puzzles.ts ./lichess_db_puzzle.csv --limit 50000
 *
 * O CSV do Lichess tem o formato:
 *   PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
 *
 * Requisitos:
 *   - .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 *   - npm install @supabase/supabase-js dotenv
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";

// Carrega variáveis de ambiente
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();
        // Remove aspas
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos em .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configurações
const BATCH_SIZE = 500;
const DEFAULT_LIMIT = 50000;

interface PuzzleRow {
  lichess_id: string;
  fen: string;
  moves: string;
  rating: number;
  rating_deviation: number;
  popularity: number;
  nb_plays: number;
  themes: string[];
  game_url: string | null;
  opening_tags: string[];
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parsePuzzleLine(line: string): PuzzleRow | null {
  const fields = parseCsvLine(line);
  if (fields.length < 9) return null;

  const rating = parseInt(fields[3], 10);
  if (isNaN(rating)) return null;

  return {
    lichess_id: fields[0],
    fen: fields[1],
    moves: fields[2],
    rating,
    rating_deviation: parseInt(fields[4], 10) || 75,
    popularity: parseInt(fields[5], 10) || 0,
    nb_plays: parseInt(fields[6], 10) || 0,
    themes: fields[7] ? fields[7].split(" ").filter(Boolean) : [],
    game_url: fields[8] || null,
    opening_tags: fields[9] ? fields[9].split(" ").filter(Boolean) : [],
  };
}

async function importPuzzles(csvPath: string, limit: number) {
  if (!fs.existsSync(csvPath)) {
    console.error(`Arquivo não encontrado: ${csvPath}`);
    process.exit(1);
  }

  console.log(`Importando puzzles de: ${csvPath}`);
  console.log(`Limite: ${limit} puzzles`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log("---");

  const fileStream = fs.createReadStream(csvPath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let batch: PuzzleRow[] = [];
  let isFirstLine = true;

  for await (const line of rl) {
    // Pula header
    if (isFirstLine) {
      isFirstLine = false;
      // Se a primeira linha parece um header, pula
      if (line.startsWith("PuzzleId") || line.startsWith("puzzleid")) {
        continue;
      }
    }

    lineNum++;
    if (imported >= limit) break;

    const puzzle = parsePuzzleLine(line);
    if (!puzzle) {
      skipped++;
      continue;
    }

    batch.push(puzzle);

    if (batch.length >= BATCH_SIZE) {
      const result = await insertBatch(batch, imported);
      imported += result.inserted;
      errors += result.errors;
      batch = [];

      // Log de progresso a cada batch
      const pct = ((imported / limit) * 100).toFixed(1);
      console.log(
        `[${pct}%] Importados: ${imported} | Erros: ${errors} | Linha: ${lineNum}`
      );
    }
  }

  // Insere batch restante
  if (batch.length > 0) {
    const result = await insertBatch(batch, imported);
    imported += result.inserted;
    errors += result.errors;
  }

  console.log("---");
  console.log(`Importação concluída!`);
  console.log(`  Total importados: ${imported}`);
  console.log(`  Skipped (parse): ${skipped}`);
  console.log(`  Erros de insert: ${errors}`);
  console.log(`  Linhas processadas: ${lineNum}`);
}

async function insertBatch(
  batch: PuzzleRow[],
  currentTotal: number
): Promise<{ inserted: number; errors: number }> {
  try {
    // upsert com ON CONFLICT no lichess_id (idempotente)
    const { data, error } = await supabase
      .from("puzzles")
      .upsert(batch, { onConflict: "lichess_id", ignoreDuplicates: true });

    if (error) {
      console.error(`Erro no batch (offset ${currentTotal}):`, error.message);
      // Tenta inserir um por um para salvar o máximo possível
      let inserted = 0;
      let errors = 0;
      for (const puzzle of batch) {
        const { error: singleError } = await supabase
          .from("puzzles")
          .upsert([puzzle], { onConflict: "lichess_id", ignoreDuplicates: true });
        if (singleError) {
          errors++;
        } else {
          inserted++;
        }
      }
      return { inserted, errors };
    }

    return { inserted: batch.length, errors: 0 };
  } catch (err) {
    console.error(`Exceção no batch (offset ${currentTotal}):`, err);
    return { inserted: 0, errors: batch.length };
  }
}

// CLI
const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith("--"));
const limitArg = args.find((a) => a.startsWith("--limit"));
const limit = limitArg ? parseInt(limitArg.split("=")[1] || args[args.indexOf(limitArg) + 1], 10) : DEFAULT_LIMIT;

if (!csvPath) {
  console.log("Uso: npx tsx scripts/import-puzzles.ts <caminho-do-csv> [--limit N]");
  console.log("");
  console.log("Exemplo:");
  console.log("  npx tsx scripts/import-puzzles.ts ./lichess_db_puzzle.csv --limit 50000");
  console.log("");
  console.log("Baixe o CSV em: https://database.lichess.org/#puzzles");
  process.exit(0);
}

importPuzzles(csvPath, limit || DEFAULT_LIMIT);
