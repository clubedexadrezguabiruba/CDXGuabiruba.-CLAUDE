/**
 * LIVRO DE ABERTURAS — carregador do lado do cliente.
 *
 * O dado vem de `public/chess/livro-aberturas.v1.json`, gerado por
 * `npm run aberturas:gerar` a partir dos TSVs vendorizados do
 * `lichess-org/chess-openings` e travado por `npm run verify:aberturas`.
 *
 * A INDEXAÇÃO É POR ARESTA, não por posição resultante. A pergunta que um livro
 * responde é "*a partir desta posição, este lance* aparece na teoria?", e é
 * exatamente essa a chave: EPD-antes → conjunto de lances UCI. Isso permite
 * vetar `2.g4` do Mate do Louco sem apagar `1.f3`, que é a Barnes Opening
 * legítima e aparece em outras linhas.
 *
 * O NOME mora à parte, só nas posições terminais nomeadas, e é consultado por
 * EPD-depois. Posição igual = abertura igual, então transposição resolve de
 * graça — inclusive depois de o jogador ter saído da teoria.
 */

/** Nome de uma abertura: ECO + família traduzida + variante (em inglês, no dado). */
export interface OpeningName {
  eco: string;
  familia: string;
  variante: string | null;
}

export interface OpeningBook {
  /** Versão do dado — vai para o `engine_info` da análise persistida. */
  revision: string;
  /** EPD-antes → lances UCI que a teoria conhece a partir dali. */
  movesByEpd: ReadonlyMap<string, ReadonlySet<string>>;
  /** EPD-depois → nome, só nas posições terminais nomeadas do TSV. */
  namesByEpd: ReadonlyMap<string, OpeningName>;
}

/**
 * EPD = os 4 primeiros campos do FEN (peças, lado, roque, en passant).
 *
 * Fora ficam o relógio de 50 lances e o número do lance, que mudam sem mudar a
 * posição. Esta função é a régua única: o gerador a importa daqui, para que o
 * livro seja indexado exatamente pela mesma chave que a revisão consulta.
 */
export function toEpd(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}

/** Versão no NOME do arquivo — o Next serve `/public` sem cache imutável. */
const URL_LIVRO = "/chess/livro-aberturas.v1.json";

interface LivroJson {
  revision: string;
  moves: Record<string, string[]>;
  /** [eco, família, variante] — tupla e não objeto, por tamanho de download. */
  names: Record<string, [string, string, string | null]>;
}

let cache: Promise<OpeningBook | null> | null = null;

async function buscar(): Promise<OpeningBook | null> {
  const resp = await fetch(URL_LIVRO);
  if (!resp.ok) return null;
  const json = (await resp.json()) as LivroJson;
  if (!json || typeof json.revision !== "string" || !json.moves || !json.names) return null;

  const movesByEpd = new Map<string, ReadonlySet<string>>();
  for (const [epd, ucis] of Object.entries(json.moves)) {
    movesByEpd.set(epd, new Set(ucis));
  }

  const namesByEpd = new Map<string, OpeningName>();
  for (const [epd, [eco, familia, variante]] of Object.entries(json.names)) {
    namesByEpd.set(epd, { eco, familia, variante });
  }

  return { revision: json.revision, movesByEpd, namesByEpd };
}

/**
 * Carrega o livro uma vez por sessão. **Nunca lança**: falha resolve `null` e a
 * revisão degrada para o comportamento de antes do livro.
 *
 * A FALHA NÃO FICA CACHEADA. Sem isso, uma queda momentânea de rede na pré-carga
 * condenaria a sessão inteira a analisar sem livro — e a criança nunca saberia
 * por quê. Zerando o cache, a próxima chamada tenta de novo.
 */
export function loadOpeningBook(): Promise<OpeningBook | null> {
  if (cache) return cache;
  const pendente = buscar()
    .catch(() => null)
    .then((livro) => {
      if (!livro) cache = null;
      return livro;
    });
  cache = pendente;
  return pendente;
}
