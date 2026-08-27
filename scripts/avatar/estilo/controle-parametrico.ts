/**
 * O CONTROLE PARAMÉTRICO DA BANCADA — a geometria do `coque`, que deixou de ser peça.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------------------------------------------------------
 *
 * As réguas de bancada da rota de arte não medem uma peça no vácuo: elas medem a
 * peça **contra um controle** — uma forma que se sabe boa, desenhada à mão, aprovada
 * pelo Doug, e que passa pelos mesmos gates. Sem ele, *"o traçado melhorou"* é
 * opinião. Esse controle era `CABELOS.coque` em nove arquivos.
 *
 * Em **2026-08-24** o Doug apagou o `coque` do catálogo. Ele tinha sido reprovado
 * duas vezes por ele — a última com **8 921 px (9,0% da peça) fora do `viewBox`**,
 * guilhotinados numa linha reta de 214 px — e a decisão foi desenhar arte nova em vez
 * de refazer aquela. Com ela saiu o **último** modelo paramétrico do elenco:
 * `MODELOS_PARAMETRICOS` ficou vazia.
 *
 * A geometria, porém, não era o problema. O que o Doug reprovou foi a ARTE tonal que
 * tentou substituí-la; a touca de 7 pontos mais a calota de raio 50 continua sendo
 * exatamente o que uma bancada quer de um controle: forma conhecida, extensão `atras`
 * conhecida, e um render que não muda mais nunca — porque ninguém a promove.
 *
 * ⚠️ **Isto NÃO é catálogo, e a diferença é o ponto.** Nada aqui é vestível: o
 * arquivo mora em `scripts/`, fora do bundle do produto, e o `id` é um rótulo
 * emprestado de uma peça viva só para satisfazer a união fechada `ModeloCabelo`.
 * Copiar esta constante de volta para `CABELOS` seria ressuscitar a peça que o Doug
 * apagou — e a decisão dele não foi sobre estes números.
 *
 * ---------------------------------------------------------------------------
 * QUANDO ESTE ARQUIVO PODE MORRER
 * ---------------------------------------------------------------------------
 *
 * Quando os nove consumidores morrerem. Eles são a bancada da esteira **traçada**
 * (`tracar-cabelo.ts`, `mapear.ts`, `vtracer.ts`, `fidelidade.ts`, `revisao.ts`,
 * `reguas-conferidas.ts`, `folha.ts`), e a esteira traçada não escreve mais nenhuma
 * peça do catálogo desde que `ARTES` esvaziou. O Doug decidiu em 2026-08-24 **não**
 * apagar esse maquinário ainda — então o controle dele precisa continuar existindo,
 * senão a árvore não compila e o que sobra é código morto que nem typecheck passa.
 */

import type { Cabelo, Ponto } from "../../../src/lib/avatar/estilo/cabelo";

/**
 * Uma elipse como OITO PONTOS, e não como dois comandos `A`.
 *
 * **Ela morava em `cabelo.ts` e veio junto**, em 2026-08-24: o único chamador era a
 * calota do `coque`, e com a peça apagada a função ficou sem usuário no produto —
 * `lint` reprova função privada não usada, e manter código morto no bundle para
 * servir uma bancada é o contrário do que este arquivo faz.
 *
 * O racional original, que continua valendo: os dois arcos custam ~90 bytes e os oito
 * pontos ~290, e mesmo assim são os pontos. `Extensao` guarda dado, não path emitido,
 * para a régua de folga conseguir medir a peça; um caso especial em `A` seria a única
 * extensão que o gate não enxerga — exatamente a forma de defeito silencioso que este
 * projeto já pagou. Oito pontos numa spline centrípeta fechada erram o círculo em
 * menos de meio por cento do raio, que a 56 px é um centésimo de pixel.
 */
function pontosElipse(cx: number, cy: number, rx: number, ry: number): Ponto[] {
  return Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * 2 * Math.PI;
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  });
}

/**
 * A touca de 7 pontos e a calota de raio 50 — o `CABELOS.coque` de 2026-08-08 a
 * 2026-08-24, byte a byte.
 *
 * O `id` é `"chanel"` por obrigação do tipo, não por parentesco: `Cabelo["id"]` é
 * `ModeloCabelo`, que é união fechada, e `"coque"` deixou de pertencer a ela. Nenhum
 * consumidor lê este campo para buscar peça no catálogo — quem quiser conferir, o
 * `id` de um `Cabelo` só é usado como chave de arquivo nas folhas de bancada.
 */
export const CONTROLE_PARAMETRICO: Cabelo = {
  id: "chanel",
  nome: "controle paramétrico (ex-coque)",
  pontos: [
    { t: -0.12, y: 206 },
    { t: 0.05, y: 152 },
    { t: 0.24, y: 108 },
    { t: 0.52, y: 100 },
    { t: 0.86, y: 110 },
    { t: 1.0, y: 158 },
    { t: 1.14, y: 204 },
  ],
  // O coque é uma BOLA, e a primeira versão era um ovo deitado de 124 × 104 —
  // com o crânio comendo a metade de baixo, o que sobrava na tela era uma laje de
  // topo reto, que lê como boina e não como coque. Uma circunferência de raio 50
  // resolve: o que passa do crânio é uma calota, e calota de círculo é redonda em
  // qualquer altura em que ela seja cortada.
  extensoes: [{ atras: true, forma: pontosElipse(228, 14, 50, 48) }],
};
