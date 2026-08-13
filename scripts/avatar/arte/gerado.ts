/**
 * O QUE OS GERADORES DESTA ROTA COMPARTILHAM.
 *
 * São dois: `arte:pecas`, que escreve `pecas-da-arte.ts` (cabelo), e
 * `arte:trajes`, que escreve `trajes-da-arte.ts`. Os dois têm modo `--check`, e o
 * `--check` dos dois precisa exatamente das mesmas duas coisas.
 *
 * Por que um módulo e não uma cópia: `pecas.ts` chama `principal()` no topo, sem
 * guarda — importar dele **executaria o gerador do cabelo**. E copiar as duas
 * funções seria começar duas que divergem, que é o motivo pelo qual `pixels.ts`
 * existe neste mesmo diretório.
 */

/**
 * AS QUEBRAS DE LINHA NORMALIZADAS — e sem isto o gate é vermelho por acidente.
 *
 * O gerador escreve `\n`; o git desta máquina tem `core.autocrlf=true` e devolve
 * `\r\n` no `checkout`. Comparar bytes crus faz o `--check` reprovar **todo
 * arquivo que o git tocou**, com um laudo que aponta a linha 1 e uma diferença de
 * bytes exatamente igual ao número de linhas. Medido em `pecas.ts`: 16 702 contra
 * 16 206, para 496 linhas.
 *
 * A pergunta do gate é *"o literal ainda é o que o gerador produz?"*, e quebra de
 * linha do working tree não faz parte dela.
 */
export const semCR = (s: string) => s.replace(/\r\n?/g, "\n");

/** A primeira linha em que as duas strings divergem — para o laudo dizer ONDE. */
export function primeiraDivergencia(a: string, b: string): number {
  const la = a.split("\n");
  const lb = b.split("\n");
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) return i + 1;
  }
  return 0;
}
