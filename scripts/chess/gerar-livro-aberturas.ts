/**
 * GERADOR DO LIVRO DE ABERTURAS.
 *
 *   npm run aberturas:gerar             regenera public/chess/livro-aberturas.v1.json
 *   npm run aberturas:gerar -- --check  falha se o commitado divergir (roda no prebuild)
 *
 * POR QUE VENDORIZAR
 * ------------------
 * Os 5 TSVs do `lichess-org/chess-openings` ficam commitados em
 * `scripts/chess/openings/`, ~390 KB. Baixar em build tornaria o CI dependente
 * da rede e do humor do upstream: um dia o livro tem 3.810 linhas, no outro tem
 * 3.812, e a precisão da criança muda sem ninguém ter tocado no código. Com o
 * dado dentro do repositório, mudar de versão é um commit com diff.
 *
 * A INDEXAÇÃO É POR ARESTA
 * ------------------------
 * `EPD-antes → conjunto de lances UCI`. A pergunta que um livro responde é "*a
 * partir desta posição, este lance* aparece na teoria?", não "esta posição
 * existe na teoria?". Três coisas saem de graça:
 *
 *  - o veto vira cirúrgico (ver `linhas-vetadas.ts`);
 *  - transposição continua funcionando, porque o selo exige que CADA lance
 *    jogado fosse teoria, e chegar à mesma posição por outra ordem de lances
 *    teóricos é aceito;
 *  - "alternativas de livro" na UI, se um dia existirem, não pedem regeração.
 *
 * O EPD é texto puro, não hash. Hash economizaria ~20 KB gzip e cobraria uma
 * função de hash idêntica entre Node e navegador, falso positivo indepurável e
 * `git diff` ilegível. Não vale.
 */

import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { Chess } from "chess.js";
import { FAMILIAS_PT } from "./familias-pt";
import { LINHAS_VETADAS } from "./linhas-vetadas";
// A régua de EPD é UMA só, e mora com o carregador que a revisão usa. Importar
// daqui é o que garante que o livro seja indexado pela mesma chave que é
// consultada em tempo de análise; duas cópias divergiriam em silêncio.
import { toEpd } from "../../src/lib/chess/openingBook";

const RAIZ = process.cwd();
const DIR_TSV = resolve(RAIZ, "scripts/chess/openings");
const ARQUIVO_LIVRO = resolve(RAIZ, "public/chess/livro-aberturas.v1.json");
const ARQUIVO_MANIFESTO = resolve(RAIZ, "scripts/chess/livro-manifesto.json");

/** Versão do dado — ecoada no JSON e no `engine_info` da análise persistida. */
export const REVISION = "v1";

/** Os 5 volumes do ECO. */
const VOLUMES = ["a", "b", "c", "d", "e"] as const;

/**
 * Proveniência, fixada à mão junto com os TSVs. Vive aqui e não só no
 * `PROVENIENCIA.md` para entrar no manifesto — quem lê o manifesto não precisa
 * abrir outro arquivo para saber de que commit o dado veio.
 */
const FONTE = {
  repo: "lichess-org/chess-openings",
  commit: "4b8622759e7ae6f93f011cc6c83a3823401ab45e",
  licenca: "CC0-1.0",
  obtido_em: "2026-08-04",
};

export interface Manifesto {
  fonte: typeof FONTE;
  /** SHA-256 do conteúdo NORMALIZADO (CRLF → LF) de cada TSV. */
  tsv_sha256: Record<string, string>;
  contagens: {
    linhas_tsv: number;
    linhas_vetadas: number;
    linhas_usadas: number;
    posicoes: number;
    arestas: number;
    nomes: number;
    familias: number;
    /**
     * Famílias que APARECEM no TSV, vetadas incluídas. Quatro delas
     * (Bongcloud, Fried Fox, Irish Gambit, Zaire) só existem em linhas vetadas
     * e por isso não entram em `familias` — mas a tradução delas segue
     * obrigatória, senão remover um veto quebraria o gerador.
     */
    familias_no_tsv: number;
  };
  bytes: { json: number };
}

export interface Livro {
  /** EPD-antes → lances UCI. */
  arestas: Map<string, Set<string>>;
  /** EPD-depois terminal → [eco, família em português, variante em inglês]. */
  nomes: Map<string, [string, string, string | null]>;
  /** Todo EPD que alguma linha atravessa — antes E depois de cada lance. */
  alcancaveis: Set<string>;
  /** Famílias que produziram arestas (as vetadas ficam de fora). */
  familiasUsadas: Set<string>;
  /** Famílias presentes no TSV, vetadas incluídas — a régua do gate de órfãs. */
  familiasNoTsv: Set<string>;
  /** Nomes de `LINHAS_VETADAS` que de fato apareceram no TSV. */
  vetosEncontrados: Set<string>;
  manifesto: Manifesto;
  /** Conteúdo exato do arquivo de livro, incluindo o `\n` final. */
  json: string;
}

/**
 * Lê um TSV normalizando fim de linha.
 *
 * O `core.autocrlf` do Windows entrega CRLF na árvore de trabalho e LF no
 * repositório. Sem normalizar, o SHA-256 do manifesto seria uma propriedade do
 * sistema operacional de quem rodou o gerador, e o gate reprovaria no CI por
 * um motivo que não tem nada a ver com xadrez.
 */
function lerTsv(volume: string): string {
  return readFileSync(resolve(DIR_TSV, `${volume}.tsv`), "utf8").replace(/\r\n?/g, "\n");
}

function sha256(texto: string): string {
  return createHash("sha256").update(texto, "utf8").digest("hex");
}

/**
 * Quebra o campo PGN do TSV em SANs.
 *
 * Aceita tanto `1. e4 e5` quanto `1.e4 e5` — o número do lance pode vir como
 * token próprio ou grudado no lance.
 */
function sansDoPgn(pgn: string): string[] {
  return pgn
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/^\d+\.+/, ""))
    .filter((t) => t.length > 0);
}

/** Serializa o livro com uma chave por linha — diff legível, sem indentação cara. */
function serializar(
  arestas: Map<string, Set<string>>,
  nomes: Map<string, [string, string, string | null]>
): string {
  const linhas: string[] = ["{", `"revision": ${JSON.stringify(REVISION)},`, `"moves": {`];

  const epdsArestas = [...arestas.keys()].sort();
  epdsArestas.forEach((epd, i) => {
    const ucis = [...arestas.get(epd)!].sort();
    const virgula = i === epdsArestas.length - 1 ? "" : ",";
    linhas.push(`${JSON.stringify(epd)}: ${JSON.stringify(ucis)}${virgula}`);
  });

  linhas.push("},", `"names": {`);

  const epdsNomes = [...nomes.keys()].sort();
  epdsNomes.forEach((epd, i) => {
    const virgula = i === epdsNomes.length - 1 ? "" : ",";
    linhas.push(`${JSON.stringify(epd)}: ${JSON.stringify(nomes.get(epd))}${virgula}`);
  });

  linhas.push("}", "}");
  return linhas.join("\n") + "\n";
}

export function gerarLivro(): Livro {
  const vetados = new Map(LINHAS_VETADAS.map((l) => [l.nome, l.motivo]));
  const vetosEncontrados = new Set<string>();

  const arestas = new Map<string, Set<string>>();
  const nomes = new Map<string, [string, string, string | null]>();
  const alcancaveis = new Set<string>();
  const familiasUsadas = new Set<string>();
  const familiasNoTsv = new Set<string>();
  const tsvSha: Record<string, string> = {};

  let linhasTsv = 0;
  let linhasVetadas = 0;
  const semTraducao = new Set<string>();
  const conflitos: string[] = [];

  for (const volume of VOLUMES) {
    const texto = lerTsv(volume);
    tsvSha[`${volume}.tsv`] = sha256(texto);

    const linhas = texto.split("\n");
    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i];
      if (!linha.trim()) continue;
      linhasTsv++;

      const [eco, nome, pgn] = linha.split("\t");
      if (!eco || !nome || !pgn) {
        throw new Error(`${volume}.tsv linha ${i + 1}: colunas faltando -- ${linha}`);
      }

      const separador = nome.indexOf(":");
      const familiaEn = (separador === -1 ? nome : nome.slice(0, separador)).trim();
      const variante = separador === -1 ? null : nome.slice(separador + 1).trim() || null;

      // A família é lida ANTES do veto de propósito: a tradução continua
      // obrigatória para linha vetada, senão tirar um veto quebraria o gerador.
      familiasNoTsv.add(familiaEn);
      const familiaPt = FAMILIAS_PT[familiaEn];
      if (!familiaPt) {
        semTraducao.add(familiaEn);
        continue;
      }

      if (vetados.has(nome)) {
        vetosEncontrados.add(nome);
        linhasVetadas++;
        continue;
      }
      familiasUsadas.add(familiaEn);

      const chess = new Chess();
      for (const san of sansDoPgn(pgn)) {
        const epdAntes = toEpd(chess.fen());
        alcancaveis.add(epdAntes);

        let movimento;
        try {
          movimento = chess.move(san);
        } catch (e) {
          throw new Error(
            `${volume}.tsv linha ${i + 1} (${nome}): SAN "${san}" rejeitado pela chess.js -- ${(e as Error).message}`
          );
        }
        const uci = movimento.from + movimento.to + (movimento.promotion ?? "");

        let destinos = arestas.get(epdAntes);
        if (!destinos) {
          destinos = new Set<string>();
          arestas.set(epdAntes, destinos);
        }
        destinos.add(uci);
      }

      const epdFinal = toEpd(chess.fen());
      alcancaveis.add(epdFinal);

      const novo: [string, string, string | null] = [eco, familiaPt, variante];
      const existente = nomes.get(epdFinal);
      if (existente) {
        // Mesmo nome para a mesma posição é duplicata de nomenclatura e some.
        // Nomes DIFERENTES para a mesma posição é decisão de curadoria, e o
        // gerador se recusa a sorteá-la.
        if (existente.join("|") !== novo.join("|")) {
          conflitos.push(`${epdFinal}\n    ${existente.join(" | ")}\n    ${novo.join(" | ")}`);
        }
      } else {
        nomes.set(epdFinal, novo);
      }
    }
  }

  if (semTraducao.size > 0) {
    throw new Error(
      `Família sem tradução em familias-pt.ts (${semTraducao.size}):\n  ` +
        [...semTraducao].sort().join("\n  ")
    );
  }
  if (conflitos.length > 0) {
    throw new Error(
      `EPD terminal com nomes diferentes (${conflitos.length}) -- resolva à mão:\n  ` +
        conflitos.join("\n  ")
    );
  }

  const orfaos = LINHAS_VETADAS.filter((l) => !vetosEncontrados.has(l.nome));
  if (orfaos.length > 0) {
    throw new Error(
      `Veto órfão: nome não existe no TSV (upstream renomeou?):\n  ` +
        orfaos.map((l) => l.nome).join("\n  ")
    );
  }

  let totalArestas = 0;
  for (const destinos of arestas.values()) totalArestas += destinos.size;

  const json = serializar(arestas, nomes);

  const manifesto: Manifesto = {
    fonte: FONTE,
    tsv_sha256: tsvSha,
    contagens: {
      linhas_tsv: linhasTsv,
      linhas_vetadas: linhasVetadas,
      linhas_usadas: linhasTsv - linhasVetadas,
      posicoes: arestas.size,
      arestas: totalArestas,
      nomes: nomes.size,
      familias: familiasUsadas.size,
      familias_no_tsv: familiasNoTsv.size,
    },
    bytes: { json: Buffer.byteLength(json, "utf8") },
  };

  return {
    arestas,
    nomes,
    alcancaveis,
    familiasUsadas,
    familiasNoTsv,
    vetosEncontrados,
    manifesto,
    json,
  };
}

export function serializarManifesto(manifesto: Manifesto): string {
  return JSON.stringify(manifesto, null, 2) + "\n";
}

/** Lê um arquivo gerado normalizando EOL — ver a nota em `lerTsv`. */
function lerGerado(caminho: string): string | null {
  if (!existsSync(caminho)) return null;
  return readFileSync(caminho, "utf8").replace(/\r\n?/g, "\n");
}

function main() {
  const checar = process.argv.includes("--check");
  const livro = gerarLivro();
  const manifestoTexto = serializarManifesto(livro.manifesto);
  const c = livro.manifesto.contagens;

  if (checar) {
    const problemas: string[] = [];
    const jsonEmDisco = lerGerado(ARQUIVO_LIVRO);
    const manifestoEmDisco = lerGerado(ARQUIVO_MANIFESTO);

    if (jsonEmDisco === null) problemas.push(`${ARQUIVO_LIVRO} não existe`);
    else if (jsonEmDisco !== livro.json) problemas.push("livro-aberturas.v1.json diverge do gerado");

    if (manifestoEmDisco === null) problemas.push(`${ARQUIVO_MANIFESTO} não existe`);
    else if (manifestoEmDisco !== manifestoTexto) problemas.push("livro-manifesto.json diverge do gerado");

    if (problemas.length > 0) {
      console.error("Livro de aberturas fora de sincronia:");
      for (const p of problemas) console.error(`  - ${p}`);
      console.error("\nRode: npm run aberturas:gerar");
      process.exit(1);
    }
    console.log(
      `Livro de aberturas em dia: ${c.arestas} arestas, ${c.nomes} nomes, ${c.familias} famílias.`
    );
    return;
  }

  mkdirSync(dirname(ARQUIVO_LIVRO), { recursive: true });
  writeFileSync(ARQUIVO_LIVRO, livro.json, "utf8");
  writeFileSync(ARQUIVO_MANIFESTO, manifestoTexto, "utf8");

  console.log("Livro de aberturas gerado.");
  console.log(`  linhas do TSV : ${c.linhas_tsv} (${c.linhas_vetadas} vetadas)`);
  console.log(`  posições      : ${c.posicoes}`);
  console.log(`  arestas       : ${c.arestas}`);
  console.log(`  nomes         : ${c.nomes}`);
  console.log(`  famílias      : ${c.familias}`);
  console.log(`  bytes (json)  : ${livro.manifesto.bytes.json}`);
}

// Só executa quando chamado direto; o gate importa `gerarLivro` sem rodar isto.
if (process.argv[1] && process.argv[1].includes("gerar-livro-aberturas")) {
  main();
}
