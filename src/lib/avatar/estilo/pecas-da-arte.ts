/**
 * AS PEÇAS TRAÇADAS DA ARTE — a saída da rota, e a **fonte** das promovidas.
 *
 * ---------------------------------------------------------------------------
 * TODA PEÇA DAQUI ESTÁ NO CATÁLOGO — e nenhuma sobra de fora
 * ---------------------------------------------------------------------------
 *
 * Em 2026-08-07 o Doug aprovou `entrada` (espetado) e `chanel`; em 2026-08-08,
 * `entrada-2` (assimétrico). `CABELOS.espetado` e `CABELOS.assimetrico`
 * **espalham os objetos daqui** e sobrescrevem só a identidade (`id` e `nome`). A
 * geometria não é recopiada — duas descrições da mesma borda é o defeito que a rota
 * inteira evita.
 *
 * ⚠️ **O `chanel` SAIU deste arquivo em 2026-08-22**, e não por poda: a arte dele
 * foi REFEITA no padrão tonal da `rosto-barba-trancada`, o Doug aprovou a folha, e
 * a nova ficou com o mesmo nome de arquivo. `CABELOS.chanel` passou a espalhar
 * `CABELOS_DA_ARTE.chanel`, que é gerado por `npm run arte:cabelos` pela esteira
 * de quem RECOLORE. Traçar a arte nova por aqui escreveria uma peça que ninguém
 * desenhou — a família traçada posteriza, e o que ela devolveria da arte nova são
 * dois ou três tons chapados de uma peça de ~250. Ver `ARTES` em `pecas.ts`.
 *
 * ⚠️ **Por isso, mexer neste arquivo mexe no catálogo.** Regerá-lo com uma arte
 * redesenhada move o render de um modelo do produto, e os selos de
 * `parametrico-congelado.ts` reprovam — o que é o comportamento certo: promoção é
 * decisão do Doug, e mudança silenciosa de peça aprovada é o que o selo pega.
 *
 * A `entrada-3` **foi apagada** na mesma poda: era a única arte que não virava peça
 * nenhuma, e servia de isca do controle 3 de `arte:revisao`. A isca passou a ser uma
 * peça paramétrica do catálogo, o que é mais seguro — ver o comentário em
 * `revisao.ts`.
 *
 * ---------------------------------------------------------------------------
 * GERADO por `npm run arte:pecas` — não editar à mão
 * ---------------------------------------------------------------------------
 *
 * Ele roda `converter()` sobre os PNGs versionados em `scripts/avatar/arte/`
 * e escreve este arquivo inteiro. **Regerar quando:** uma arte for redesenhada, ou
 * quando uma decisão do conversor mudar o que ele produz para todas — foi o caso
 * do teto de compressão passar a ser lido na escala de entrega.
 *
 * Quem cobra que este arquivo não envelheça é o **controle 6** de
 * `npm run arte:revisao`: ele reconverte a arte e compara ponto a ponto, e
 * recusa desenhar a folha se divergir.
 *
 * O formato é o da **peça sobreposta** (Bloco 4): `massa` como laço fechado em
 * {t,y}, `clara`/`claras` para a região iluminada, `linhas` como arcos de índice
 * sobre a massa, e `formas` para os pedaços que a massa não alcança.
 */

import type { Cabelo } from "./cabelo";

export const PECAS_DA_ARTE = {

} as const satisfies Record<string, Cabelo>;

/**
 * O id de uma peça da arte — o nome do ARQUIVO, não o slug do catálogo.
 *
 * Não é `ModeloCabelo`: `entrada` e `entrada-2` não existem no catálogo, e as duas
 * promovidas entraram com outro nome (`entrada` → `espetado`). É por isso que
 * `CABELOS` sobrescreve o `id` ao espalhar — o cast abaixo não corrige runtime.
 */
export type IdDaArte = keyof typeof PECAS_DA_ARTE;

export const IDS_DA_ARTE = Object.keys(PECAS_DA_ARTE) as IdDaArte[];
