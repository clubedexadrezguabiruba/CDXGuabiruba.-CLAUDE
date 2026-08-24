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
  /** espetado, com pontas altas. Traçada de `entrada.png` por `npm run arte:pecas`. */
  "entrada": {
    id: "entrada" as Cabelo["id"],
    nome: "Espetado",
    massa: [
      { t: 0.558, y: -39.697 },
      { t: 0.570, y: -35.758 },
      { t: 0.515, y: -9.924 },
      { t: 0.817, y: -21.212 },
      { t: 0.911, y: -38.864 },
      { t: 0.926, y: -35.000 },
      { t: 0.931, y: -15.833 },
      { t: 0.905, y: 18.712 },
      { t: 0.988, y: 18.258 },
      { t: 1.049, y: 11.667 },
      { t: 1.055, y: 22.500 },
      { t: 1.297, y: 56.515 },
      { t: 1.274, y: 67.500 },
      { t: 1.237, y: 73.333 },
      { t: 1.069, y: 99.091 },
      { t: 1.105, y: 130.833 },
      { t: 1.127, y: 160.833 },
      { t: 1.111, y: 166.364 },
      { t: 1.065, y: 159.318 },
      { t: 1.013, y: 229.167 },
      { t: 0.994, y: 233.561 },
      { t: 0.977, y: 229.167 },
      { t: 0.959, y: 174.848 },
      { t: 0.927, y: 181.212 },
      { t: 0.883, y: 138.333 },
      { t: 0.831, y: 118.182 },
      { t: 0.818, y: 133.333 },
      { t: 0.770, y: 152.348 },
      { t: 0.706, y: 112.273 },
      { t: 0.652, y: 152.500 },
      { t: 0.548, y: 178.333 },
      { t: 0.546, y: 154.015 },
      { t: 0.500, y: 169.015 },
      { t: 0.464, y: 116.439 },
      { t: 0.401, y: 139.924 },
      { t: 0.317, y: 152.045 },
      { t: 0.335, y: 121.288 },
      { t: 0.261, y: 146.667 },
      { t: 0.199, y: 191.667 },
      { t: 0.163, y: 177.273 },
      { t: 0.145, y: 242.652 },
      { t: 0.112, y: 236.742 },
      { t: 0.055, y: 210.530 },
      { t: 0.013, y: 230.833 },
      { t: 0.009, y: 267.500 },
      { t: -0.025, y: 278.258 },
      { t: -0.081, y: 249.167 },
      { t: -0.105, y: 194.242 },
      { t: -0.140, y: 199.848 },
      { t: -0.151, y: 195.833 },
      { t: -0.131, y: 160.000 },
      { t: -0.092, y: 128.030 },
      { t: -0.138, y: 129.167 },
      { t: -0.125, y: 91.667 },
      { t: -0.190, y: 62.045 },
      { t: -1.669, y: 47.500 },
      { t: -0.021, y: 36.364 },
      { t: 0.085, y: 31.970 },
      { t: 0.103, y: 12.500 },
      { t: 0.148, y: -9.848 },
      { t: 0.199, y: -22.955 },
      { t: 0.211, y: -20.606 },
      { t: 0.206, y: 10.152 },
      { t: 0.373, y: -26.515 },
    ],
    clara: [
      { t: 0.515, y: -29.015 },
      { t: 0.468, y: 5.152 },
      { t: 0.812, y: -11.288 },
      { t: 0.898, y: -25.152 },
      { t: 0.871, y: -2.500 },
      { t: 0.799, y: 27.197 },
      { t: 0.936, y: 29.924 },
      { t: 1.027, y: 24.242 },
      { t: 1.193, y: 58.333 },
      { t: 1.156, y: 75.455 },
      { t: 1.024, y: 86.061 },
      { t: 1.091, y: 146.818 },
      { t: 1.027, y: 130.455 },
      { t: 1.014, y: 153.561 },
      { t: 0.968, y: 110.379 },
      { t: 0.948, y: 148.561 },
      { t: 0.888, y: 110.833 },
      { t: 0.821, y: 92.879 },
      { t: 0.798, y: 133.258 },
      { t: 0.752, y: 96.667 },
      { t: 0.696, y: 79.697 },
      { t: 0.630, y: 127.500 },
      { t: 0.598, y: 139.621 },
      { t: 0.563, y: 103.106 },
      { t: 0.529, y: 128.485 },
      { t: 0.460, y: 86.515 },
      { t: 0.368, y: 127.197 },
      { t: 0.363, y: 95.227 },
      { t: 0.288, y: 111.212 },
      { t: 0.196, y: 156.288 },
      { t: 0.186, y: 126.061 },
      { t: 0.129, y: 154.167 },
      { t: 0.102, y: 186.591 },
      { t: 0.065, y: 156.894 },
      { t: 0.014, y: 178.561 },
      { t: 0.004, y: 147.879 },
      { t: -0.076, y: 163.712 },
      { t: -0.057, y: 141.667 },
      { t: 0.002, y: 104.015 },
      { t: -0.101, y: 111.212 },
      { t: -0.088, y: 81.970 },
      { t: -0.108, y: 64.091 },
      { t: -4.731, y: 45.985 },
      { t: 0.103, y: 43.712 },
      { t: 0.146, y: 5.000 },
      { t: 0.179, y: -6.364 },
      { t: 0.200, y: 28.182 },
      { t: 0.361, y: -15.000 },
    ],
    linhas: [[0,0]],
  },
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
