# A mão do Doug sobre a oclusão do chapéu

Cada `<slug>.png` aqui é uma **correção pintada à mão** da região que aquele chapéu
esconde do cabelo. Ela é **entrada da esteira**, como o `.png` da própria peça —
nunca saída. É isso que mantém `src/lib/avatar/estilo/chapeus-da-arte.ts` sendo
arquivo gerado, e o que faz apagar o PNG devolver exatamente o estado de máquina.

## O vocabulário, e ele é de duas cores

| pincel | pixel | efeito |
|---|---|---|
| **esconder** | verde (G > R) | entra na região: o chapéu passa a conter |
| **mostrar** | vermelho (R > G) | sai da região: o cabelo volta a aparecer |
| — | transparente | a máquina decide, como sempre |

O arquivo tem o tamanho do raster da arte (**780 × 930**), então 1 px aqui é 1 px
lá. Tamanho diferente é reamostrado por vizinho, sem inventar cor entre as duas.

## Como pintar

**No navegador:** `npm run dev` e abra `/dev/avatar-oclusao`. Pincel de esconder e
mostrar, lupa até 8×, e os 19 cabelos ao lado em tamanho real — o botão *salvar na
arte* escreve aqui. Depois é `npm run arte:chapeus` para o catálogo pegar.

**Em editor externo:** pinte um PNG de 780 × 930 com as duas cores acima e salve
aqui com o nome do slug. A esteira lê igual; a rota do navegador é só conforto.

## Por que a correção é do CHAPÉU e não do par

A região erra igual nos 19 cabelos, porque ela é do chapéu. São **9 edições e
acabou**, e cabelo novo herda de graça. Por par seriam 171 máscaras, mais 9 a cada
peça nova — esteira sem fim.

## Onde estão os números

`npm run arte:par` mede os 171 pares. O argumento completo, com as duas construções
alternativas que foram medidas e caíram, está no topo de `../oclusao-do-chapeu.ts`.
