/**
 * QUEM JÁ ATRAVESSOU A ESTEIRA — a lista de artes que as réguas de traço julgam.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE ARQUIVO NASCEU, E QUAL DEFEITO ELE FECHA
 * ---------------------------------------------------------------------------
 *
 * `arte:traco` e `arte:borda` julgam o mesmo traço em faixas vizinhas do mesmo eixo:
 * uma pergunta se o traço do BONECO continua inteiro, a outra se o contorno da PEÇA é
 * preto. As duas percorriam uma constante `APROVADAS` **escrita à mão**, e cada uma
 * tinha a própria cópia.
 *
 * Em 2026-08-24 as duas cópias estavam defasadas do mesmo jeito: listavam
 * `barba-trancada`, `chanel`, `entrada` e `entrada-2` — e **três artes promovidas em
 * 2026-08-22 nunca entraram nelas**, `moicano`, `assimetrico` e `burst-fade`. As duas
 * réguas passavam verdes sobre 1 dos 4 cabelos do catálogo.
 *
 * Medido no dia em que o defeito foi encontrado, e é por isso que ele não virou
 * incêndio: as três passam nas duas réguas — `arte:borda` 0 px de cinza nas três;
 * `arte:traco` 0 px apagados em duas e 18 px em 18 ilhas de 1 px no `assimetrico`,
 * contra piso de 8 por componente. **A omissão não escondeu defeito. Escondia a
 * possibilidade de haver um**, que é a única coisa que uma régua faz.
 *
 * ---------------------------------------------------------------------------
 * A LISTA É DERIVADA, E É POR ISSO QUE ELA MORA AQUI
 * ---------------------------------------------------------------------------
 *
 * Lista escrita envelhece uma vez por promoção, e envelhece **em silêncio**: ninguém
 * lembra de dois arquivos de régua ao colar a peça no catálogo. Então ela sai de onde
 * a promoção já obriga a escrever — os mapas `NOMES` dos geradores, que são a mesma
 * fonte de `CABELOS_DA_ARTE` e `ROSTOS_DA_ARTE`. Peça promovida entra na régua no
 * mesmo gesto em que entra no produto, sem terceiro lugar para esquecer.
 *
 * Os mapas moram AQUI, e não em `cabelos.ts` / `rostos.ts`, por um motivo mecânico:
 * aqueles dois arquivos são executáveis — chamam `principal()` no topo do módulo —, e
 * importá-los de dentro de uma régua rodaria o gerador junto com a medição.
 *
 * ⚠️ **O traje não entra.** Ele é a outra metade da bifurcação da Regra Inviolável
 * nº 4: cor final assada, servida como `<image>` dentro do `.svg`. O que estas duas
 * réguas medem é o traço de quem RECOLORE, e a lista sempre foi só de cabelo e rosto.
 */

import { PASTA } from "./base";

/**
 * O nome que a criança lê, por arte de CABELO promovida. Uma linha por peça.
 *
 * A chave é o nome do ARQUIVO sem extensão, como em `PECAS_DA_ARTE` — e não o slug
 * com prefixo. É por essa chave que `CABELOS.<modelo>` espalha o objeto, e é ela que
 * o `id` gravado carrega, motivo pelo qual o catálogo **sobrescreve a identidade** na
 * promoção (ver `CABELOS` em `cabelo.ts`).
 *
 * ⚠️ **Uma linha por arte que ATRAVESSOU A ESTEIRA — não por peça aprovada.** A regra
 * mudou em 2026-08-22, quando o Doug pediu para julgar a peça no runtime: estar aqui
 * põe a arte no seletor *"da arte · tonal"* do `/dev/avatar-kokeshi`, que é onde o
 * parecer acontece. **A aprovação continua morando em `CABELOS`** (`cabelo.ts`), que
 * é o que a criança vê. A trava do outro lado não mudou: um nome **sem** arte no
 * disco reprova.
 */
export const NOMES_CABELO: Record<string, string> = {
  // A primeira peça tonal do slot, aprovada pelo Doug em 2026-08-22 sobre a folha.
  // O arquivo `chanel.png` foi SOBRESCRITO pela arte nova, por decisão dele ("ele
  // substitui o velho, pode manter o mesmo nome") — e é por isso que `chanel` saiu
  // de `ARTES` em `pecas.ts` no mesmo commit: um nome de arquivo, uma arte, uma
  // esteira.
  chanel: "Chanel",
  // Atravessou a esteira em 2026-08-22: Gate −1 aprovada com 0 px nas protegidas,
  // traço do boneco inteiro, contorno preto, figurinha de 562 px e nenhuma janela de
  // feição aberta. Era PARAMÉTRICA antes — a primeira migração que apaga selo de
  // congelado em vez de só movê-lo.
  moicano: "Moicano",
  // Atravessou a esteira em 2026-08-22 e substituiu `entrada-2.png`, a arte traçada
  // do mesmo modelo. É a primeira arte que nasce inteira sob a regra do contorno
  // azul-marinho: 35 661 px de linha azul (20,2%) e 3 947 px dela POR CIMA do traço
  // do boneco — o conjunto que a versão preta perdia inteiro.
  assimetrico: "Assimétrico",
  // O primeiro cabelo tonal que NÃO substitui ninguém — modelo novo, fora dos cinco
  // do elenco antigo, e por isso ele não saiu de família nenhuma na promoção: entrou
  // direto em `CABELOS` e em `MODELOS_TONAIS`.
  "burst-fade": "Burst Fade",
};

/**
 * O nome que a criança lê, por arte de ROSTO promovida. Uma linha por peça.
 *
 * Ele não se deriva do slug pelo motivo que `trajes.ts` já escreve: `barba-cheia`
 * viraria "Cheia", que não é nome de coisa nenhuma. E a raridade **não** mora aqui —
 * ela é do servidor, e vive em `avatar_catalogo` (Regra Inviolável nº 1).
 *
 * ⚠️ **Uma só, e é assim desde 2026-08-21.** O elenco do slot chegou a nove artes de
 * barba; o Doug reprovou oito olhando e ficou com a trançada, que ele chamou de *"a
 * melhor arte"* e que virou o padrão de acabamento do projeto inteiro. Em 2026-08-24
 * ele confirmou: só a trançada fica.
 */
export const NOMES_ROSTO: Record<string, string> = {
  "barba-trancada": "Barba Trancada",
};

/**
 * As artes que a rota já promoveu SOBRE A BASE OFICIAL, como caminho de PNG.
 *
 * É a lista que `arte:traco` e `arte:borda` percorrem quando ninguém passa alvo na
 * linha de comando. Rosto primeiro, cabelo depois, cada bloco em ordem de inserção —
 * a ordem só afeta a leitura do relatório.
 */
export const ARTES_PROMOVIDAS: string[] = [
  ...Object.keys(NOMES_ROSTO),
  ...Object.keys(NOMES_CABELO),
].map((arquivo) => `${PASTA}/${arquivo}.png`);
