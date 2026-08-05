/**
 * GATE DO LIVRO DE ABERTURAS.
 *
 *   npm run verify:aberturas
 *
 * Offline por inteiro: filesystem e chess.js, nenhum segredo, nenhuma rede.
 * Roda em CI como qualquer outro gate.
 *
 * O que ele impede, em uma frase cada:
 *
 *  1. livro commitado diferente do que o gerador produz hoje;
 *  2. TSV editado à mão sem passar pelo manifesto;
 *  3. contagem mudando sozinha — com a fonte fixada por SHA, ela não pode;
 *  4. linha de TSV que a chess.js não consegue replicar;
 *  5. nome apontando para posição que a teoria não alcança;
 *  6. `familias-pt.ts` apodrecendo nos dois sentidos;
 *  7. o arquivo engordando até virar problema de rede na escola;
 *  8. o veto tendo deixado de funcionar sem ninguém notar.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { gzipSync } from "zlib";
import { Chess } from "chess.js";
import {
  gerarLivro,
  serializarManifesto,
  type Manifesto,
} from "../../chess/gerar-livro-aberturas";
import { FAMILIAS_PT } from "../../chess/familias-pt";
import { LINHAS_VETADAS } from "../../chess/linhas-vetadas";
import { toEpd } from "../../../src/lib/chess/openingBook";

const RAIZ = process.cwd();
const ARQUIVO_LIVRO = resolve(RAIZ, "public/chess/livro-aberturas.v1.json");
const ARQUIVO_MANIFESTO = resolve(RAIZ, "scripts/chess/livro-manifesto.json");
const DIR_TSV = resolve(RAIZ, "scripts/chess/openings");

/**
 * Teto de download, em KB de gzip.
 *
 * MEDIDO, não estimado: 121,9 KB no commit `4b86227` do upstream (3.810 linhas).
 * O teto tem ~11% de folga sobre o medido — o bastante para o upstream crescer
 * um pouco sem falso alarme, pouco o bastante para uma mudança de formato que
 * dobre o arquivo bater aqui. O plano original chutava 120 KB a partir de uma
 * estimativa de ~95; o número acima é o que a régua devolveu.
 *
 * Na prática a Vercel serve `/public` com brotli, e em brotli são 90,2 KB. O
 * teto é medido em gzip porque é o pior caso servido.
 */
const TETO_GZIP_KB = 135;

const VOLUMES = ["a", "b", "c", "d", "e"] as const;
const EPD_INICIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";

interface LivroJson {
  revision: string;
  moves: Record<string, string[]>;
  names: Record<string, [string, string, string | null]>;
}

let passed = 0;
let failed = 0;

function ok(msg: string) {
  console.log(`  [PASS] ${msg}`);
  passed++;
}

function nok(msg: string, detalhe: string) {
  console.log(`  [FAIL] ${msg} -- ${detalhe}`);
  failed++;
}

/** Lê normalizando EOL — ver a nota sobre `core.autocrlf` no gerador. */
function ler(caminho: string): string {
  return readFileSync(caminho, "utf8").replace(/\r\n?/g, "\n");
}

/** EPD → FEN completo. O relógio não entra no EPD e não muda o EPD do destino. */
function fenDe(epd: string): string {
  return `${epd} 0 1`;
}

function main() {
  console.log("========================================");
  console.log("GATE: livro de aberturas");
  console.log("========================================");

  if (!existsSync(ARQUIVO_LIVRO) || !existsSync(ARQUIVO_MANIFESTO)) {
    console.error("\nLivro ou manifesto não existe. Rode: npm run aberturas:gerar");
    process.exit(1);
  }

  const livro = gerarLivro();
  const jsonEmDisco = ler(ARQUIVO_LIVRO);
  const manifestoEmDisco = ler(ARQUIVO_MANIFESTO);

  // --- 1. regeração byte-a-byte ---
  console.log("\n1. Regeração determinística");

  if (jsonEmDisco === livro.json) {
    ok("livro-aberturas.v1.json é byte-a-byte o que o gerador produz");
  } else {
    nok(
      "livro-aberturas.v1.json diverge do gerado",
      `disco ${jsonEmDisco.length} bytes vs gerado ${livro.json.length} -- rode npm run aberturas:gerar`
    );
  }

  const manifestoGerado = serializarManifesto(livro.manifesto);
  if (manifestoEmDisco === manifestoGerado) {
    ok("livro-manifesto.json é byte-a-byte o que o gerador produz");
  } else {
    nok("livro-manifesto.json diverge do gerado", "rode npm run aberturas:gerar");
  }

  // O resto das asserções lê o arquivo DE DISCO, não a estrutura em memória —
  // senão o gate só provaria que o gerador concorda consigo mesmo.
  const disco = JSON.parse(jsonEmDisco) as LivroJson;
  const manifesto = JSON.parse(manifestoEmDisco) as Manifesto;

  // --- 2. SHA-256 dos TSVs ---
  console.log("\n2. Integridade dos TSVs vendorizados");

  let shaOk = true;
  for (const volume of VOLUMES) {
    const nome = `${volume}.tsv`;
    const esperado = manifesto.tsv_sha256[nome];
    const atual = livro.manifesto.tsv_sha256[nome];
    if (!esperado) {
      nok(`${nome} sem SHA no manifesto`, "manifesto incompleto");
      shaOk = false;
    } else if (esperado !== atual) {
      nok(`${nome} mudou`, `manifesto ${esperado.slice(0, 12)}… vs disco ${atual.slice(0, 12)}…`);
      shaOk = false;
    }
  }
  if (shaOk) ok(`SHA-256 dos ${VOLUMES.length} TSVs bate com o manifesto (fonte ${manifesto.fonte.commit.slice(0, 7)})`);

  // --- 3. contagens exatas ---
  console.log("\n3. Contagens exatas");

  const arestasNoDisco = Object.values(disco.moves).reduce((s, ucis) => s + ucis.length, 0);
  const esperadas: [string, number, number][] = [
    ["linhas do TSV", manifesto.contagens.linhas_tsv, livro.manifesto.contagens.linhas_tsv],
    ["linhas vetadas", manifesto.contagens.linhas_vetadas, LINHAS_VETADAS.length],
    ["posições", manifesto.contagens.posicoes, Object.keys(disco.moves).length],
    ["arestas", manifesto.contagens.arestas, arestasNoDisco],
    ["nomes", manifesto.contagens.nomes, Object.keys(disco.names).length],
    ["famílias", manifesto.contagens.familias, livro.familiasUsadas.size],
    ["famílias no TSV", manifesto.contagens.familias_no_tsv, livro.familiasNoTsv.size],
  ];
  for (const [rotulo, doManifesto, medido] of esperadas) {
    if (doManifesto === medido) ok(`${rotulo}: ${medido}`);
    else nok(`${rotulo} divergiu`, `manifesto ${doManifesto} vs medido ${medido}`);
  }

  // --- 4. toda linha do TSV replica na chess.js ---
  console.log("\n4. Replicação de todas as linhas na chess.js");

  // O gerador já lança em SAN rejeitado, mas ele PULA as linhas vetadas. Sem
  // este passo, um erro de digitação numa linha vetada ficaria invisível — e o
  // dia em que o veto saísse, o gerador quebraria sem explicação.
  const nomesVetados = new Set(LINHAS_VETADAS.map((l) => l.nome));
  let replicadas = 0;
  const falhas: string[] = [];
  for (const volume of VOLUMES) {
    const linhas = ler(resolve(DIR_TSV, `${volume}.tsv`)).split("\n");
    for (let i = 1; i < linhas.length; i++) {
      if (!linhas[i].trim()) continue;
      const [, nome, pgn] = linhas[i].split("\t");
      const chess = new Chess();
      try {
        for (const san of pgn.trim().split(/\s+/).map((t) => t.replace(/^\d+\.+/, "")).filter(Boolean)) {
          chess.move(san);
        }
        replicadas++;
      } catch (e) {
        falhas.push(`${volume}.tsv:${i + 1} (${nome}): ${(e as Error).message}`);
      }
    }
  }
  if (falhas.length === 0) {
    ok(`${replicadas} linhas replicadas sem SAN rejeitado (${nomesVetados.size} vetadas incluídas)`);
  } else {
    nok(`${falhas.length} linhas não replicam`, falhas.slice(0, 3).join(" | "));
  }

  // --- 5. nomes só em posições alcançáveis, e sem conflito ---
  console.log("\n5. Nomes ancorados em posições que a teoria alcança");

  // Caminhada de largura pelo grafo DE DISCO, saindo da posição inicial. Um
  // nome que não caia nesta varredura aponta para uma posição que nenhuma
  // sequência de lances de livro produz — o dado estaria mentindo.
  const visitados = new Set<string>([EPD_INICIAL]);
  const fila: string[] = [EPD_INICIAL];
  while (fila.length > 0) {
    const epd = fila.pop()!;
    const saidas = disco.moves[epd];
    if (!saidas) continue;
    for (const uci of saidas) {
      const chess = new Chess(fenDe(epd));
      chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci[4] : undefined,
      });
      const destino = toEpd(chess.fen());
      if (!visitados.has(destino)) {
        visitados.add(destino);
        fila.push(destino);
      }
    }
  }

  const inalcancaveis = Object.keys(disco.names).filter((epd) => !visitados.has(epd));
  if (inalcancaveis.length === 0) {
    ok(`${Object.keys(disco.names).length} nomes, todos em posições alcançáveis (${visitados.size} posições varridas)`);
  } else {
    nok(`${inalcancaveis.length} nomes inalcançáveis`, inalcancaveis.slice(0, 2).join(" | "));
  }

  // Conflito de nome: o gerador lança se dois nomes diferentes caírem no mesmo
  // EPD terminal. Ter chegado até aqui já é a prova; a asserção deixa isso
  // visível no relatório em vez de escondido num throw que ninguém vê passar.
  ok("zero conflito de nome (dois nomes distintos no mesmo EPD terminal)");

  // --- 6. tabela de famílias nos dois sentidos ---
  console.log("\n6. familias-pt.ts");

  const traduzidas = new Set(Object.keys(FAMILIAS_PT));
  const semTraducao = [...livro.familiasNoTsv].filter((f) => !traduzidas.has(f));
  const orfas = [...traduzidas].filter((f) => !livro.familiasNoTsv.has(f));

  if (semTraducao.length === 0) ok(`todas as ${livro.familiasNoTsv.size} famílias do TSV têm tradução`);
  else nok(`${semTraducao.length} famílias sem tradução`, semTraducao.slice(0, 5).join(", "));

  if (orfas.length === 0) ok(`nenhuma tradução órfã em familias-pt.ts`);
  else nok(`${orfas.length} traduções órfãs`, orfas.slice(0, 5).join(", "));

  // --- 7. teto de download ---
  console.log("\n7. Tamanho do download");

  const gzipKb = gzipSync(Buffer.from(livro.json, "utf8"), { level: 9 }).length / 1024;
  const rawKb = livro.manifesto.bytes.json / 1024;
  if (gzipKb <= TETO_GZIP_KB) {
    ok(`${gzipKb.toFixed(1)} KB gzip (${rawKb.toFixed(1)} KB cru) — teto ${TETO_GZIP_KB} KB`);
  } else {
    nok(`livro passou do teto`, `${gzipKb.toFixed(1)} KB gzip > ${TETO_GZIP_KB} KB`);
  }

  // --- 8. sanidade semântica, com casos tirados do dado gerado ---
  console.log("\n8. Sanidade semântica");

  /** Percorre SANs a partir da inicial e devolve o EPD antes do último lance. */
  function epdAntesDoUltimo(sans: string[]): { epdAntes: string; uci: string; epdDepois: string } {
    const chess = new Chess();
    for (const san of sans.slice(0, -1)) chess.move(san);
    const epdAntes = toEpd(chess.fen());
    const mv = chess.move(sans[sans.length - 1]);
    return { epdAntes, uci: mv.from + mv.to + (mv.promotion ?? ""), epdDepois: toEpd(chess.fen()) };
  }

  function epdApos(sans: string[]): string {
    const chess = new Chess();
    for (const san of sans) chess.move(san);
    return toEpd(chess.fen());
  }

  function ehLivro(sans: string[]): boolean {
    const { epdAntes, uci } = epdAntesDoUltimo(sans);
    return (disco.moves[epdAntes] ?? []).includes(uci);
  }

  // 8a. positivos
  if (ehLivro(["e4"])) ok("1.e4 é lance de livro");
  else nok("1.e4 deveria ser livro", "aresta ausente");

  // 1.a4 é a Ware Opening — nomeada, e por isso NÃO serve de negativo.
  if (ehLivro(["a4"])) ok("1.a4 é livro (Ware Opening) — o negativo óbvio não é negativo");
  else nok("1.a4 deveria ser livro", "Ware Opening sumiu do dado");

  const nomeApos1e4 = disco.names[epdApos(["e4"])];
  if (nomeApos1e4) ok(`depois de 1.e4 a família resolve: ${nomeApos1e4[1]} (${nomeApos1e4[0]})`);
  else nok("depois de 1.e4 nenhum nome resolve", "names sem a posição");

  const najdorf = ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"];
  const nomeNajdorf = disco.names[epdApos(najdorf)];
  if (nomeNajdorf && nomeNajdorf[1] === "Defesa Siciliana" && nomeNajdorf[0] === "B90") {
    ok(`a linha da Najdorf dá "${nomeNajdorf[1]} · ${nomeNajdorf[0]}" (${nomeNajdorf[2]})`);
  } else {
    nok("Najdorf não resolve para Defesa Siciliana B90", JSON.stringify(nomeNajdorf ?? null));
  }

  // 8b. o veto de fato tirou as arestas-piada
  if (!ehLivro(["e4", "e5", "Ke2"])) ok("2.Ke2 (Bongcloud) NÃO é livro — veto ativo");
  else nok("2.Ke2 voltou a ser livro", "veto do Bongcloud não pegou");

  if (!ehLivro(["f3", "e5", "g4"])) ok("2.g4 (Mate do Louco) NÃO é livro — veto ativo");
  else nok("2.g4 voltou a ser livro", "veto do Fool's Mate não pegou");

  // ...e a aresta COMPARTILHADA sobreviveu: o veto é cirúrgico, não uma poda.
  if (ehLivro(["f3"])) ok("1.f3 continua livro (Barnes Opening) — veto não podou a linha legítima");
  else nok("1.f3 sumiu junto com o Mate do Louco", "veto podou demais");

  // 8c. todo nome de linha vetada precisa existir no TSV (senão o veto é letra morta)
  const vetosOrfaos = LINHAS_VETADAS.filter((l) => !livro.vetosEncontrados.has(l.nome));
  if (vetosOrfaos.length === 0) {
    ok(`os ${LINHAS_VETADAS.length} vetos casaram com uma linha real do TSV`);
  } else {
    nok(`${vetosOrfaos.length} vetos órfãos`, vetosOrfaos.map((l) => l.nome).join(", "));
  }

  // 8d. revision do arquivo é a que o carregador espera no nome
  if (disco.revision === "v1") ok('revision === "v1", casando com livro-aberturas.v1.json');
  else nok("revision não casa com o nome do arquivo", disco.revision);

  console.log("\n========================================");
  console.log(`RESULTADO: ${passed} passed | ${failed} failed`);
  console.log("========================================");

  if (failed > 0) process.exit(1);
  console.log("\nGate do livro de aberturas: OK");
}

main();
