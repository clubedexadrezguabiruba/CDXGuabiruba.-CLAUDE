/**
 * O SLOT ÓCULOS — a segunda família do slot `rosto`, e ela é do outro braço.
 *
 * ---------------------------------------------------------------------------
 * DUAS FAMÍLIAS NO MESMO SLOT, E A BIFURCAÇÃO CAI DENTRO DELE
 * ---------------------------------------------------------------------------
 *
 * O slot `rosto` guarda barba e óculos, e a pergunta que bifurca toda peça nova
 * (Regra Inviolável nº 4 — *a peça recolore?*) responde diferente para cada uma:
 *
 * | família | recolore? | formato | esteira |
 * |---|---|---|---|
 * | **barba** | **sim**, com o cabelo (D17 — barba é cabelo) | `formas` + máscara de tom | `barba-para-formas.ts` |
 * | **óculos** | **não**, cor final assada | `<image>` WEBP no `.svg` | este arquivo |
 *
 * É por isso que o óculos passa por `peca-de-arte.ts`, ao lado de traje e chapéu, e
 * não por `construirRosto` — e é por isso que o literal dos dois sai do MESMO
 * `rostos.ts`, que é onde as duas famílias se encontram de novo.
 *
 * ---------------------------------------------------------------------------
 * A ARTE ENTRA CRUA, E ISSO É O CONTRÁRIO DA BARBA
 * ---------------------------------------------------------------------------
 *
 * A rota do rosto manda `restaurar-peca.ts` rodar ANTES do Gate −1 (doc 19 §13), e o
 * passo 3 dele leva o matiz da peça para 180° — o ciano instrumental. Para a barba
 * isso é inócuo: a cor final vem de `var(--av-cabelo)`, e o que a esteira aproveita
 * da arte é só o claro-escuro.
 *
 * **Para o óculos seria fatal.** A cor que sai é a que a artista pintou, e uma
 * armação girada para 180° chega ao produto CIANO. Então a esteira raster lê a arte
 * **crua**, como o chapéu já faz — e a arte limpa continua existindo, com um papel
 * só: é ela que atravessa o Gate −1 e o `arte:traco`, porque esses dois perguntam
 * *"o boneco se mexeu?"*, e para essa pergunta o ciano é o instrumento certo.
 *
 * Uso: `npm run arte:oculos` (o plural, `oculoss.ts`, escreve o literal).
 */
import { noCampoDoOculos, noVaoDaLente } from "./base";
import { mascaraDaLinha, neutralizar } from "./linha-instrumental";
import { type FabricaDeTinta, type SlotDeArte } from "./peca-de-arte";

/**
 * Onde o `.svg` da peça é escrito: **`public/items/oculos/`**, a prateleira do slot.
 *
 * Ela era `public/items/rosto/` enquanto o óculos era a segunda família daquele slot.
 * Com o slot próprio (2026-08-27), a pasta acompanha — é `public/items/<slot>/` em
 * traje, chapéu e rosto, e não há motivo para o quinto ser exceção.
 */
export const PASTA_OCULOS = "public/items/oculos";

/**
 * A convenção de slug: **`oculos-<nome>`**, e ele já É o slug do catálogo.
 *
 * Sem prefixo a acrescentar, ao contrário da barba (`barba-trancada.png` →
 * `rosto-barba-trancada`): o nome do slot já abre o nome do arquivo, como em
 * `chapeu-bone.png` → `chapeu-bone`. `avatar_catalogo` tem chave primária única para
 * todos os slots, e é o prefixo que a garante.
 */
export const OCULOS: SlotDeArte = {
  nome: "oculos",
  slug: /^oculos-[a-z0-9]+(-[a-z0-9]+)*$/,
  pasta: PASTA_OCULOS,
  campo: noCampoDoOculos,
  // O VÃO DA LENTE. Sem esta linha a armação chega ao produto com um retrato da base
  // de edição dentro de cada aro — 23 038 px de pele assada, medidos. Ver
  // `SlotDeArte.janela` e `noVaoDaLente`.
  janela: noVaoDaLente,
};

/**
 * A TINTA DO ÓCULOS — identidade na massa, cinza neutro na LINHA INSTRUMENTAL.
 *
 * É a mesma do chapéu, e pelo mesmo motivo: a armação **cruza o contorno da cabeça**
 * por construção nas laterais, que é o slot em que *preto sobre preto difere ~0* é a
 * regra e não o azar. Quando a arte vier com as linhas em `#0000C8`, elas são
 * extraídas inteiras e saem `(L, L, L)` — cinza da própria luminância —, e o contorno
 * da peça lê igual ao do boneco.
 *
 * ⚠️ **A primeira arte do slot NÃO veio com a linha azul**, e atravessou assim mesmo:
 * `restaurar-peca` mediu **0 px de linha instrumental** e o `arte:traco` mediu **0 px
 * do traço do boneco apagados**. Nesse caso `mascaraDaLinha` devolve máscara vazia e
 * esta fábrica é a identidade — o mesmo que não passar fábrica nenhuma. A régua fica
 * porque o próximo óculos pode precisar dela, e porque descobrir isso na peça é mais
 * caro que carregá-la.
 */
export const tintaDoOculos: FabricaDeTinta = (e) => {
  const { linha } = mascaraDaLinha(e.arte.data, e.arte.w, e.arte.h, (i) => e.mascara[i] === 1);
  return {
    aplicar: (i) => {
      const j = i * 3;
      const c: [number, number, number] = [e.arte.data[j], e.arte.data[j + 1], e.arte.data[j + 2]];
      return linha[i] ? neutralizar(c[0], c[1], c[2]) : c;
    },
    // A peça já chega em cor final: não há cor declarada, e o relatório diz isso.
    declarada: null,
  };
};
