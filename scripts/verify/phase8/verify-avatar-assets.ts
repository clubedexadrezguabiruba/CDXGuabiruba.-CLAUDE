/**
 * GATE: integridade catálogo ↔ assets do avatar (D20, T0.1/T0.4) — ratchet
 *
 * O BUG QUE ESTE GATE EXISTE PARA IMPEDIR
 * ---------------------------------------
 * 45 dos 77 itens do catálogo não aparecem no boneco. A criança abre um baú,
 * ganha um Elmo de Cavaleiro, equipa, e nada muda. Nada em lugar nenhum
 * acusa o problema: o resolver monta o caminho por convenção de nome e o
 * <img> devolve `null` no onError.
 *
 * O gate confere DUAS coisas diferentes, que antes eram confundidas numa só:
 *
 *   1. MINIATURA — `items.image_url` existe em disco. É o que aparece no
 *      inventário, no SlotGrid e na animação de abertura do baú.
 *   2. BONECO — todos os arquivos que o render exige existem. Para `head` e
 *      `outfit` são DOIS arquivos (variante por gênero), não um.
 *
 * Um item pode ter miniatura e não vestir (os 7 chapéus), ou vestir sem
 * arquivo nenhum (as molduras, que são CSS). Tratar isso como uma coisa só
 * foi parte de como o problema passou despercebido.
 *
 * RATCHET, NÃO LIMPEZA RETROATIVA
 * -------------------------------
 * O legado de 45 itens quebrados está congelado em `asset-baseline.json`. O
 * gate falha se um item NOVO entrar quebrado, ou se um item que hoje funciona
 * regredir. É o mesmo idioma de verify:no-dup-rpc — o passivo é aceito, o
 * crescimento não. Quando a arte da F1/F4 chegar, o baseline encolhe.
 *
 * Uso: npm run verify:avatar-assets
 *      npm run verify:avatar-assets -- --update   (regrava o baseline)
 */

import postgres from "postgres";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { getDbUrl } from "../db-url";
import { varrerAssets } from "../../avatar/asset-scan";
import { avaliarRenderabilidade, assetsExigidos } from "../../../src/lib/avatar/renderability";
import type { ItemSlot } from "../../../src/types/inventory";

const BASELINE_PATH = "scripts/verify/phase8/asset-baseline.json";

interface Baseline {
  gerado_em: string;
  por_que: string;
  /** ids de itens que hoje não vestem o boneco. */
  sem_boneco: number[];
  /** ids de itens cujo image_url não existe em disco. */
  sem_miniatura: number[];
  /** arquivos em public/items/ que nenhum item referencia. */
  arquivos_orfaos: string[];
}

interface ItemDb {
  id: number;
  name: string;
  slot: ItemSlot;
  rarity: string;
  image_url: string | null;
}

/** Arquivos que existem por razões estruturais, não por apontar para um item. */
const ASSETS_ESTRUTURAIS = new Set([
  "/items/base/avatar-base-male.png",
  "/items/base/avatar-base-female.png",
  // O CORPO NÃO É UM ITEM DE CATÁLOGO. Nenhuma linha de `items` aponta para ele,
  // e nenhuma deve: ninguém equipa o próprio corpo.
  //
  // O neutro estava fora desta lista desde que a base virou SVG, e o gate
  // reprovava por isso — descoberto ao acrescentar o sem-traje, não causado por
  // ele. É a mesma família de falha que este gate existe para pegar, só que no
  // gate.
  "/items/base/avatar-base-neutro.svg",
  // Derivado do neutro por `npm run avatar:base-sem-traje`. É o que o avatar
  // VESTIDO usa: a ausência do macacão precisa ser estrutural, porque a regra de
  // CSS que a fingia não alcança o conteúdo de `<use>`.
  "/items/base/avatar-base-sem-traje.svg",
]);

async function main() {
  const atualizar = process.argv.includes("--update");
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: catálogo x assets do avatar");
  console.log("========================================");

  let itens: ItemDb[];
  try {
    // id::int no SELECT: bigint volta como string do driver, e um baseline
    // com ids em string ordena errado e compara errado.
    itens = await sql<ItemDb[]>`
      select id::int as id, name, slot, rarity, image_url from items order by id`;
  } finally {
    await sql.end();
  }

  // Varredura fresca do disco. NÃO usa o assetManifest.ts commitado de
  // propósito: se ele estivesse desatualizado, o gate aprovaria uma mentira.
  // A conferência do arquivo commitado é o `prebuild` (gen-manifest --check).
  const noDisco = new Set(varrerAssets());
  const existe = (caminho: string) => noDisco.has(caminho);

  const semBoneco: ItemDb[] = [];
  const semMiniatura: ItemDb[] = [];
  const exigidosPorAlgumItem = new Set<string>();

  for (const item of itens) {
    if (item.image_url) {
      exigidosPorAlgumItem.add(item.image_url);
      // Variante animada do pet é opcional, mas não é órfã quando existe.
      exigidosPorAlgumItem.add(item.image_url.replace(/\.png$/, "-animated.png"));
      if (!existe(item.image_url)) semMiniatura.push(item);
    } else {
      semMiniatura.push(item);
    }

    for (const c of assetsExigidos(item)) exigidosPorAlgumItem.add(c);

    if (!avaliarRenderabilidade(item, existe).renderiza) semBoneco.push(item);
  }

  const orfaos = [...noDisco]
    .filter((c) => !exigidosPorAlgumItem.has(c) && !ASSETS_ESTRUTURAIS.has(c))
    .sort();

  console.log(`\nCatálogo: ${itens.length} itens | Disco: ${noDisco.size} arquivos`);
  console.log(`  veste o boneco:     ${itens.length - semBoneco.length}`);
  console.log(`  tem miniatura:      ${itens.length - semMiniatura.length}`);
  console.log(`  arquivos órfãos:    ${orfaos.length}`);

  if (atualizar) {
    const novo: Baseline = {
      gerado_em: new Date().toISOString().slice(0, 10),
      por_que:
        "Passivo de arte herdado da v2. Encolhe conforme a F1/F4 do avatar v4 " +
        "entrega os assets. O gate falha se crescer.",
      sem_boneco: semBoneco.map((i) => i.id).sort((a, b) => a - b),
      sem_miniatura: semMiniatura.map((i) => i.id).sort((a, b) => a - b),
      arquivos_orfaos: orfaos,
    };
    writeFileSync(resolve(process.cwd(), BASELINE_PATH), JSON.stringify(novo, null, 2) + "\n");
    console.log(`\nBaseline regravado em ${BASELINE_PATH}.`);
    console.log("Explique no commit o que mudou e por quê.");
    return;
  }

  const baseline: Baseline = JSON.parse(readFileSync(resolve(process.cwd(), BASELINE_PATH), "utf-8"));
  const congeladosBoneco = new Set(baseline.sem_boneco);
  const congeladosMini = new Set(baseline.sem_miniatura);
  const congeladosOrfaos = new Set(baseline.arquivos_orfaos);

  const violacoes: string[] = [];
  const melhorias: string[] = [];

  for (const item of semBoneco) {
    if (congeladosBoneco.has(item.id)) continue;
    const faltando = avaliarRenderabilidade(item, existe).faltando;
    violacoes.push(
      `item ${item.id} "${item.name}" (${item.slot}) não veste o boneco — falta: ${faltando.join(", ") || "image_url nulo"}`,
    );
  }

  for (const item of semMiniatura) {
    if (congeladosMini.has(item.id)) continue;
    violacoes.push(
      `item ${item.id} "${item.name}" (${item.slot}) sem miniatura — ${item.image_url ?? "image_url nulo"} não existe`,
    );
  }

  for (const arquivo of orfaos) {
    if (congeladosOrfaos.has(arquivo)) continue;
    violacoes.push(`arquivo órfão: ${arquivo} não é referenciado por nenhum item`);
  }

  const idsSemBoneco = new Set(semBoneco.map((i) => i.id));
  const idsSemMini = new Set(semMiniatura.map((i) => i.id));
  const consertadosBoneco = baseline.sem_boneco.filter((id) => !idsSemBoneco.has(id));
  const consertadosMini = baseline.sem_miniatura.filter((id) => !idsSemMini.has(id));
  const orfaosResolvidos = baseline.arquivos_orfaos.filter((a) => !orfaos.includes(a));

  if (consertadosBoneco.length) melhorias.push(`${consertadosBoneco.length} item(ns) passaram a vestir o boneco: ${consertadosBoneco.join(", ")}`);
  if (consertadosMini.length) melhorias.push(`${consertadosMini.length} item(ns) ganharam miniatura: ${consertadosMini.join(", ")}`);
  if (orfaosResolvidos.length) melhorias.push(`${orfaosResolvidos.length} arquivo(s) deixaram de ser órfãos`);

  console.log(`\nPassivo congelado no baseline (${baseline.gerado_em}):`);
  console.log(`  sem boneco:    ${baseline.sem_boneco.length}`);
  console.log(`  sem miniatura: ${baseline.sem_miniatura.length}`);
  console.log(`  órfãos:        ${baseline.arquivos_orfaos.length}`);

  if (melhorias.length > 0) {
    console.log("\n--- PROGRESSO (rode com --update para encolher o baseline) ---");
    for (const m of melhorias) console.log(`  [OK] ${m}`);
  }

  if (violacoes.length > 0) {
    console.log("\n--- VIOLAÇÕES ---");
    for (const v of violacoes) console.log(`  [FAIL] ${v}`);
    console.log("\nUm item que não aparece no boneco quebra o loop de recompensa:");
    console.log("a criança ganha, equipa e nada muda. Entregue o asset, ou");
    console.log("remova o item do catálogo. Não adicione ao baseline sem motivo.");
    console.log("\n========================================");
    console.log(`RESULTADO: ${violacoes.length} violações`);
    console.log("========================================");
    process.exit(1);
  }

  console.log("\n  [PASS] Nenhum item novo quebrado, nenhuma regressão, nenhum órfão novo");
  console.log("\n========================================");
  console.log("RESULTADO: 0 violações");
  console.log("========================================");
  console.log("\nGate catálogo x assets: OK");
}

main().catch((e) => {
  console.error("Erro no gate:", e.message);
  process.exit(1);
});
