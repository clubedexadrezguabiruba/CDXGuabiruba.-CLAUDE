/**
 * A PEÇA IMPORTADA — o literal que `avatar:importar` produziu, colado à mão.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE ARQUIVO EXISTE, E POR QUE ELE NÃO É `cabelo.ts`
 * ---------------------------------------------------------------------------
 *
 * A colagem é manual pelo mesmo motivo dos 42 pontos do contorno do crânio: um
 * literal colado aparece no diff, um literal gerado em tempo de build não. E quem
 * prova que a cópia continua fiel à fonte é `npm run avatar:importar -- --check`,
 * que reimporta e compara número a número — não um hash escrito em markdown, que é
 * número à mão e apodrece (é por isso que `docs/ESTADO.md` é gerado).
 *
 * Ele mora **ao lado da fonte**, e não no catálogo, porque a peça ainda não foi
 * aprovada: o checkpoint C é parada dura — folha, o olho do Doug, selo em `ficha.md`.
 * Enquanto isso:
 *
 *  - o catálogo de `src/lib/avatar/estilo/cabelo.ts` fica **intocado**, e a regressão
 *    do B4 continua valendo para os **cinco** modelos paramétricos, byte a byte;
 *  - o `--check` já tem dente hoje: mexer no `semantica.svg` sem recolar deixa
 *    vermelho, que é o risco de verdade (fonte e runtime divergindo em silêncio);
 *  - nada de runtime importa daqui. Isto é dado de fonte, não código de produto.
 *
 * ---------------------------------------------------------------------------
 * O QUE ELE **NÃO** DIZ
 * ---------------------------------------------------------------------------
 *
 * Que a peça está boa. `avatar:importar` imprime três achados que o importador não
 * resolve — cobertura da coroa, folga sobre a sobrancelha, contenção da clara —, e
 * os três são decisão de direção de arte com a folha na mão. Ver `ficha.md`.
 *
 * ---------------------------------------------------------------------------
 * `linhas` SÃO ÍNDICES, E NÃO PONTOS
 * ---------------------------------------------------------------------------
 *
 * Cada par é `[primeiro, último]` em índices de `massa`: os trechos do laço em que a
 * sonda pela normal achou preto DA ARTE, e que por isso saem traçados. O resto do
 * laço fica sem linha porque ali quem desenha a borda na arte é a cabeça do boneco
 * do gerador, que é `descarte` — traçar o laço inteiro poria uma barra preta
 * atravessando a coroa que a arte não tem. Ver `Cabelo.linhas`.
 */

export const PECA = {
  massa: [
    { t: 0.518, y: 23.047 },
    { t: 0.564, y: 13.532 },
    { t: 0.571, y: 44.229 },
    { t: 0.608, y: 38.323 },
    { t: 0.782, y: 43.806 },
    { t: 1.075, y: 62.996 },
    { t: 1.016, y: 78.67 },
    { t: 0.965, y: 93.71 },
    { t: 1.029, y: 104.711 },
    { t: 0.996, y: 111.512 },
    { t: 1.012, y: 122.49 },
    { t: 0.996, y: 129.113 },
    { t: 1.024, y: 147.696 },
    { t: 0.944, y: 169.384 },
    { t: 1.027, y: 175.855 },
    { t: 1.029, y: 195.469 },
    { t: 0.983, y: 213.251 },
    { t: 0.995, y: 176.388 },
    { t: 0.928, y: 169.384 },
    { t: 0.909, y: 157.269 },
    { t: 0.869, y: 165.207 },
    { t: 0.832, y: 124.683 },
    { t: 0.801, y: 121.34 },
    { t: 0.735, y: 138.887 },
    { t: 0.732, y: 125.518 },
    { t: 0.689, y: 115.909 },
    { t: 0.577, y: 166.878 },
    { t: 0.513, y: 152.673 },
    { t: 0.5, y: 138.469 },
    { t: 0.518, y: 124.683 },
    { t: 0.375, y: 138.051 },
    { t: 0.403, y: 125.936 },
    { t: 0.337, y: 132.203 },
    { t: 0.285, y: 150.167 },
    { t: 0.27, y: 176.069 },
    { t: 0.235, y: 178.575 },
    { t: 0.24, y: 195.286 },
    { t: 0.201, y: 207.819 },
    { t: 0.211, y: 217.428 },
    { t: 0.181, y: 227.037 },
    { t: 0.194, y: 217.428 },
    { t: 0.157, y: 204.477 },
    { t: 0.1, y: 206.566 },
    { t: 0.033, y: 224.53 },
    { t: 0.025, y: 247.562 },
    { t: -0.039, y: 226.312 },
    { t: -0.027, y: 208.833 },
    { t: 0.036, y: 198.268 },
    { t: -0.033, y: 170.971 },
    { t: -0.019, y: 154.734 },
    { t: -0.037, y: 147.325 },
    { t: 0.006, y: 115.432 },
    { t: -0.026, y: 107.087 },
    { t: -0.008, y: 92.887 },
    { t: -0.036, y: 85.751 },
    { t: -0.012, y: 74.761 },
    { t: -0.07, y: 68.088 },
    { t: -0.286, y: 51.317 },
    { t: 0.289, y: 40.99 },
    { t: 0.021, y: 50.647 },
    { t: 0.294, y: 40.807 },
    { t: 0.443, y: 38.064 },
    { t: 0.468, y: 44.435 },
    { t: 0.474, y: 10.213 },
  ],
  clara: [
    { t: 0.504, y: 21.392 },
    { t: 0.514, y: 27.252 },
    { t: 0.564, y: 15.745 },
    { t: 0.547, y: 40.529 },
    { t: 0.565, y: 39.865 },
    { t: 1.821, y: 45.724 },
    { t: 0.977, y: 52.826 },
    { t: 0.989, y: 69.119 },
    { t: 0.94, y: 76.221 },
    { t: 0.949, y: 82.488 },
    { t: 0.919, y: 89.59 },
    { t: 0.989, y: 109.225 },
    { t: 0.973, y: 114.656 },
    { t: 0.995, y: 124.683 },
    { t: 0.974, y: 132.203 },
    { t: 0.984, y: 143.482 },
    { t: 0.95, y: 142.229 },
    { t: 0.93, y: 151.002 },
    { t: 0.915, y: 132.203 },
    { t: 0.932, y: 124.683 },
    { t: 0.889, y: 131.785 },
    { t: 0.879, y: 147.66 },
    { t: 0.848, y: 131.785 },
    { t: 0.865, y: 125.1 },
    { t: 0.842, y: 109.643 },
    { t: 0.805, y: 107.972 },
    { t: 0.781, y: 115.074 },
    { t: 0.789, y: 124.265 },
    { t: 0.749, y: 132.62 },
    { t: 0.765, y: 124.265 },
    { t: 0.751, y: 109.643 },
    { t: 0.64, y: 93.35 },
    { t: 0.669, y: 107.554 },
    { t: 0.652, y: 124.265 },
    { t: 0.58, y: 136.798 },
    { t: 0.599, y: 124.683 },
    { t: 0.581, y: 118.416 },
    { t: 0.545, y: 127.607 },
    { t: 0.52, y: 107.554 },
    { t: 0.473, y: 102.123 },
    { t: 0.447, y: 123.429 },
    { t: 0.422, y: 126.771 },
    { t: 0.406, y: 109.643 },
    { t: 0.386, y: 107.136 },
    { t: 0.28, y: 138.469 },
    { t: 0.256, y: 153.927 },
    { t: 0.238, y: 150.167 },
    { t: 0.237, y: 140.14 },
    { t: 0.2, y: 150.167 },
    { t: 0.21, y: 185.677 },
    { t: 0.15, y: 169.802 },
    { t: 0.114, y: 175.651 },
    { t: 0.095, y: 159.358 },
    { t: 0.055, y: 163.535 },
    { t: 0.027, y: 149.749 },
    { t: 0.098, y: 117.581 },
    { t: 0.011, y: 110.478 },
    { t: 0.032, y: 97.945 },
    { t: 0.012, y: 90.843 },
    { t: 0.043, y: 79.981 },
    { t: -0.006, y: 72.879 },
    { t: 0.013, y: 59.928 },
    { t: -0.133, y: 45.724 },
    { t: 0.477, y: 13.729 },
  ],
  linhas: [[14, 19], [29, 35], [36, 37], [38, 39], [43, 13]],
} as const;
