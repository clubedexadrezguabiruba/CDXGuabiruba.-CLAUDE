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
    { t: 0.564, y: 13.532 },
    { t: 0.556, y: 38.759 },
    { t: 1.069, y: 64.26 },
    { t: 0.966, y: 74.55 },
    { t: 1.067, y: 64.719 },
    { t: 0.966, y: 74.968 },
    { t: 1.066, y: 65.119 },
    { t: 0.967, y: 75.386 },
    { t: 1.065, y: 65.403 },
    { t: 0.965, y: 76.221 },
    { t: 1.045, y: 75.123 },
    { t: 0.975, y: 84.994 },
    { t: 0.98, y: 102.958 },
    { t: 1.03, y: 96.785 },
    { t: 0.974, y: 115.909 },
    { t: 1.024, y: 114.644 },
    { t: 0.982, y: 140.558 },
    { t: 1.026, y: 136.343 },
    { t: 1.026, y: 154.018 },
    { t: 0.944, y: 169.384 },
    { t: 1.027, y: 173.668 },
    { t: 1.028, y: 212.011 },
    { t: 0.983, y: 210.744 },
    { t: 0.995, y: 176.341 },
    { t: 0.869, y: 165.207 },
    { t: 0.832, y: 124.683 },
    { t: 0.735, y: 138.887 },
    { t: 0.689, y: 115.909 },
    { t: 0.577, y: 166.878 },
    { t: 0.513, y: 152.673 },
    { t: 0.518, y: 124.683 },
    { t: 0.285, y: 150.167 },
    { t: 0.194, y: 217.428 },
    { t: 0.1, y: 206.566 },
    { t: -0.027, y: 243.355 },
    { t: -0.028, y: 204.728 },
    { t: 0.042, y: 195.704 },
    { t: -0.027, y: 183.417 },
    { t: -0.025, y: 126.059 },
    { t: 0.017, y: 130.531 },
    { t: -0.031, y: 95.454 },
    { t: 0.022, y: 97.527 },
    { t: -0.035, y: 88.845 },
    { t: 0.03, y: 79.981 },
    { t: -0.055, y: 69.974 },
    { t: 0.29, y: 41.133 },
    { t: 0.468, y: 44.432 },
    { t: 0.474, y: 10.213 },
  ],
  clara: [
    { t: 0.51, y: 18.4 },
    { t: 0.514, y: 27.252 },
    { t: 0.558, y: 15.497 },
    { t: 0.547, y: 40.529 },
    { t: 0.565, y: 39.865 },
    { t: 1.821, y: 45.724 },
    { t: 0.934, y: 54.793 },
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
    { t: 0.482, y: 11.541 },
  ],
  linhas: [[20, 23], [30, 32], [33, 19]],
} as const;
