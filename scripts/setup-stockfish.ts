import { cpSync, mkdirSync, statSync } from "fs";
import { resolve } from "path";

const SRC_DIR = resolve("node_modules/stockfish/bin");
const DEST_DIR = resolve("public/stockfish");

const FILES = ["stockfish-18-lite-single.js", "stockfish-18-lite-single.wasm"];

mkdirSync(DEST_DIR, { recursive: true });

for (const file of FILES) {
  const src = resolve(SRC_DIR, file);
  // Copy with simpler names for easier reference
  const destName = file.replace("stockfish-18-lite-single", "stockfish");
  const dest = resolve(DEST_DIR, destName);
  cpSync(src, dest);
  const { size } = statSync(dest);
  const sizeMB = (size / 1024 / 1024).toFixed(1);
  console.log(`  ${destName}: ${sizeMB} MB`);
}

console.log(`\nStockfish assets copiados para public/stockfish/`);
