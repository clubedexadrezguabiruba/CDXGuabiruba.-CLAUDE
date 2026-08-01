/**
 * Gera imagens placeholder para todos os itens do CdxGuabiruba.
 * Usa sharp (já disponível via Next.js) para criar PNGs simples.
 *
 * Uso: npx tsx scripts/generate-placeholders.ts
 */
import sharp from "sharp";
import { mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

// ============================================================
// Dados dos itens (espelho exato das seeds do banco)
// ============================================================
interface ItemSeed {
  name: string;
  slot: string;
  rarity: string;
  imagePath: string; // path relativo a public/
}

const ITEMS: ItemSeed[] = [
  // Head (8)
  { name: "Boné de Peão", slot: "head", rarity: "common", imagePath: "items/head/bone-peao.png" },
  { name: "Bandana Tática", slot: "head", rarity: "common", imagePath: "items/head/bandana-tatica.png" },
  { name: "Elmo de Cavaleiro", slot: "head", rarity: "rare", imagePath: "items/head/elmo-cavaleiro.png" },
  { name: "Óculos de Estrategista", slot: "head", rarity: "rare", imagePath: "items/head/oculos-estrategista.png" },
  { name: "Tiara da Rainha", slot: "head", rarity: "epic", imagePath: "items/head/tiara-rainha.png" },
  { name: "Coroa Sombria", slot: "head", rarity: "epic", imagePath: "items/head/coroa-sombria.png" },
  { name: "Coroa do Rei Dourado", slot: "head", rarity: "legendary", imagePath: "items/head/coroa-rei-dourado.png" },
  { name: "Capuz do Arquimago", slot: "head", rarity: "legendary", imagePath: "items/head/capuz-arquimago.png" },
  // Outfit (8)
  { name: "Uniforme de Aprendiz", slot: "outfit", rarity: "common", imagePath: "items/outfit/uniforme-aprendiz.png" },
  { name: "Camiseta do Clube", slot: "outfit", rarity: "common", imagePath: "items/outfit/camiseta-clube.png" },
  { name: "Túnica Azul", slot: "outfit", rarity: "rare", imagePath: "items/outfit/tunica-azul.png" },
  { name: "Armadura Leve", slot: "outfit", rarity: "rare", imagePath: "items/outfit/armadura-leve.png" },
  { name: "Veste de Mago", slot: "outfit", rarity: "epic", imagePath: "items/outfit/veste-mago.png" },
  { name: "Armadura Real", slot: "outfit", rarity: "epic", imagePath: "items/outfit/armadura-real.png" },
  { name: "Manto Lendário", slot: "outfit", rarity: "legendary", imagePath: "items/outfit/manto-lendario.png" },
  { name: "Armadura do Grande Mestre", slot: "outfit", rarity: "legendary", imagePath: "items/outfit/armadura-gm.png" },
  // Hand: removido em 2026-07-31 (D-E do doc 15) — o boneco kokeshi não tem mãos
  // Background (8)
  { name: "Sala de Aula", slot: "background", rarity: "common", imagePath: "items/bg/sala-aula.png" },
  { name: "Parque", slot: "background", rarity: "common", imagePath: "items/bg/parque.png" },
  { name: "Biblioteca Antiga", slot: "background", rarity: "rare", imagePath: "items/bg/biblioteca.png" },
  { name: "Torneio", slot: "background", rarity: "rare", imagePath: "items/bg/torneio.png" },
  { name: "Castelo Medieval", slot: "background", rarity: "epic", imagePath: "items/bg/castelo.png" },
  { name: "Tabuleiro Gigante", slot: "background", rarity: "epic", imagePath: "items/bg/tabuleiro-gigante.png" },
  { name: "Céu Estrelado", slot: "background", rarity: "legendary", imagePath: "items/bg/ceu-estrelado.png" },
  { name: "Dimensão Xadrez", slot: "background", rarity: "legendary", imagePath: "items/bg/dimensao-xadrez.png" },
  // Frame (8)
  { name: "Moldura de Madeira", slot: "frame", rarity: "common", imagePath: "items/frame/madeira.png" },
  { name: "Moldura Cinza", slot: "frame", rarity: "common", imagePath: "items/frame/cinza.png" },
  { name: "Moldura de Bronze", slot: "frame", rarity: "rare", imagePath: "items/frame/bronze.png" },
  { name: "Moldura de Prata", slot: "frame", rarity: "rare", imagePath: "items/frame/prata.png" },
  { name: "Moldura de Ouro", slot: "frame", rarity: "epic", imagePath: "items/frame/ouro.png" },
  { name: "Moldura de Cristal", slot: "frame", rarity: "epic", imagePath: "items/frame/cristal.png" },
  { name: "Moldura de Diamante", slot: "frame", rarity: "legendary", imagePath: "items/frame/diamante.png" },
  { name: "Moldura Ancestral", slot: "frame", rarity: "legendary", imagePath: "items/frame/ancestral.png" },
  // Pet (7)
  { name: "Peãozinho de Madeira", slot: "pet", rarity: "common", imagePath: "items/pet/peaozinho-madeira.png" },
  { name: "Cavalo de Bronze", slot: "pet", rarity: "rare", imagePath: "items/pet/cavalo-bronze.png" },
  { name: "Coruja Sábia", slot: "pet", rarity: "rare", imagePath: "items/pet/coruja-sabia.png" },
  { name: "Dragão de Cristal", slot: "pet", rarity: "epic", imagePath: "items/pet/dragao-cristal.png" },
  { name: "Fênix Dourada", slot: "pet", rarity: "epic", imagePath: "items/pet/fenix-dourada.png" },
  { name: "Rei Espectral", slot: "pet", rarity: "legendary", imagePath: "items/pet/rei-espectral.png" },
  { name: "Grifo Ancestral", slot: "pet", rarity: "legendary", imagePath: "items/pet/grifo-ancestral.png" },
];

// ============================================================
// Configuração visual
// ============================================================
const RARITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  common: { bg: "#94a3b8", text: "#1e293b", label: "Comum" },
  rare: { bg: "#3b82f6", text: "#ffffff", label: "Raro" },
  epic: { bg: "#a855f7", text: "#ffffff", label: "Épico" },
  legendary: { bg: "#f59e0b", text: "#1e293b", label: "Lendário" },
};

const SLOT_EMOJI: Record<string, string> = {
  head: "👑",
  outfit: "🎽",
  background: "🏰",
  frame: "🖼",
  pet: "🐾",
};

const SLOT_DIMENSIONS: Record<string, { w: number; h: number }> = {
  head: { w: 100, h: 60 },
  outfit: { w: 140, h: 160 },
  background: { w: 200, h: 280 },
  frame: { w: 220, h: 300 },
  pet: { w: 80, h: 80 },
};

const PUBLIC_DIR = join(process.cwd(), "public");

// ============================================================
// Gerador de SVG → PNG via sharp
// ============================================================
function createItemSvg(item: ItemSeed): string {
  const dim = SLOT_DIMENSIONS[item.slot];
  const colors = RARITY_COLORS[item.rarity];
  const emoji = SLOT_EMOJI[item.slot];

  // Tamanho de fonte adaptativo
  const fontSize = Math.max(10, Math.min(14, dim.w / 10));
  const emojiSize = Math.max(16, Math.min(32, dim.w / 4));

  // Quebrar nome em linhas se necessário
  const maxCharsPerLine = Math.floor(dim.w / (fontSize * 0.6));
  const words = item.name.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = (currentLine + " " + word).trim();
    }
  }
  if (currentLine) lines.push(currentLine);

  const textY = dim.h / 2 + emojiSize / 2;
  const lineHeight = fontSize + 4;

  const textElements = lines
    .map(
      (line, i) =>
        `<text x="${dim.w / 2}" y="${textY + i * lineHeight}" text-anchor="middle" fill="${colors.text}" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold">${escapeXml(line)}</text>`
    )
    .join("\n    ");

  // Badge de raridade
  const badgeY = dim.h - 16;
  const badgeText = colors.label;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}" viewBox="0 0 ${dim.w} ${dim.h}">
  <defs>
    <clipPath id="rounded">
      <rect width="${dim.w}" height="${dim.h}" rx="12" ry="12"/>
    </clipPath>
  </defs>
  <rect width="${dim.w}" height="${dim.h}" rx="12" ry="12" fill="${colors.bg}" opacity="0.85"/>
  <text x="${dim.w / 2}" y="${dim.h / 2 - lineHeight}" text-anchor="middle" font-size="${emojiSize}" font-family="Arial, sans-serif">${emoji}</text>
  ${textElements}
  <rect x="${dim.w / 2 - 30}" y="${badgeY - 10}" width="60" height="16" rx="8" fill="${colors.text}" opacity="0.3"/>
  <text x="${dim.w / 2}" y="${badgeY + 2}" text-anchor="middle" fill="${colors.text}" font-size="9" font-family="Arial, sans-serif">${badgeText}</text>
</svg>`;
}

function createAvatarBaseSvg(): string {
  // Silhueta simples de boneco (cabeça + corpo)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
  <rect width="200" height="280" fill="none"/>
  <!-- Cabeça -->
  <circle cx="100" cy="70" r="40" fill="#d4d4d8" stroke="#a1a1aa" stroke-width="2"/>
  <!-- Olhos -->
  <circle cx="85" cy="62" r="5" fill="#3f3f46"/>
  <circle cx="115" cy="62" r="5" fill="#3f3f46"/>
  <!-- Sorriso -->
  <path d="M 85 80 Q 100 95 115 80" fill="none" stroke="#3f3f46" stroke-width="2" stroke-linecap="round"/>
  <!-- Pescoço -->
  <rect x="90" y="108" width="20" height="15" fill="#d4d4d8"/>
  <!-- Corpo -->
  <rect x="55" y="120" width="90" height="100" rx="15" fill="#e4e4e7" stroke="#a1a1aa" stroke-width="2"/>
  <!-- Braços -->
  <rect x="30" y="125" width="30" height="70" rx="12" fill="#d4d4d8" stroke="#a1a1aa" stroke-width="2"/>
  <rect x="140" y="125" width="30" height="70" rx="12" fill="#d4d4d8" stroke="#a1a1aa" stroke-width="2"/>
  <!-- Pernas -->
  <rect x="65" y="215" width="28" height="55" rx="10" fill="#d4d4d8" stroke="#a1a1aa" stroke-width="2"/>
  <rect x="107" y="215" width="28" height="55" rx="10" fill="#d4d4d8" stroke="#a1a1aa" stroke-width="2"/>
</svg>`;
}

function createFrameSvg(item: ItemSeed): string {
  const colors = RARITY_COLORS[item.rarity];
  // Moldura: retângulo com borda estilizada ao redor de 200x280
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="300" viewBox="0 0 220 300">
  <rect x="2" y="2" width="216" height="296" rx="16" ry="16" fill="none" stroke="${colors.bg}" stroke-width="6" opacity="0.9"/>
  <rect x="8" y="8" width="204" height="284" rx="12" ry="12" fill="none" stroke="${colors.bg}" stroke-width="2" opacity="0.5"/>
  <text x="110" y="290" text-anchor="middle" fill="${colors.bg}" font-size="10" font-family="Arial, sans-serif" opacity="0.7">${escapeXml(item.name)}</text>
</svg>`;
}

function createBackgroundSvg(item: ItemSeed): string {
  const colors = RARITY_COLORS[item.rarity];
  // Fundo com gradiente suave e nome
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${colors.bg}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${colors.bg}" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect width="200" height="280" rx="12" fill="url(#bgGrad)"/>
  <text x="100" y="270" text-anchor="middle" fill="${colors.bg}" font-size="10" font-family="Arial, sans-serif" opacity="0.6">${escapeXml(item.name)}</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log("Gerando placeholders para Fase 8...\n");

  // Criar diretórios
  const dirs = ["items/base", "items/head", "items/outfit", "items/bg", "items/frame", "items/pet"];
  for (const dir of dirs) {
    const fullPath = join(PUBLIC_DIR, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      console.log(`  mkdir: public/${dir}/`);
    }
  }

  // Gerar avatar base
  const baseSvg = createAvatarBaseSvg();
  const basePath = join(PUBLIC_DIR, "items/base/avatar-base.png");
  await sharp(Buffer.from(baseSvg)).png().toFile(basePath);
  console.log("  ✓ items/base/avatar-base.png (200x280)");

  // Gerar itens
  let count = 0;
  for (const item of ITEMS) {
    let svg: string;
    if (item.slot === "frame") {
      svg = createFrameSvg(item);
    } else if (item.slot === "background") {
      svg = createBackgroundSvg(item);
    } else {
      svg = createItemSvg(item);
    }

    const outPath = join(PUBLIC_DIR, item.imagePath);
    const dir = dirname(outPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    await sharp(Buffer.from(svg)).png().toFile(outPath);
    count++;

    const dim = item.slot === "frame" ? "220x300" : item.slot === "background" ? "200x280" : `${SLOT_DIMENSIONS[item.slot].w}x${SLOT_DIMENSIONS[item.slot].h}`;
    console.log(`  ✓ ${item.imagePath} (${dim}) [${item.rarity}]`);
  }

  console.log(`\n✅ Gerados: 1 avatar base + ${count} itens = ${count + 1} PNGs`);
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
