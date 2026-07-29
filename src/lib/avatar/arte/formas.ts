/**
 * Primitivas de forma da arte do avatar v4.
 *
 * Ficam aqui, e não dentro de um desenho, porque os 39 desenhos do Bloco 8
 * precisam da mesma régua de canto e do mesmo jeito de emitir path — é assim
 * que a consistência de estilo deixa de depender de eu lembrar.
 */

export type Ponto = [number, number];

/**
 * Polígono de cantos arredondados. Serve para canto convexo e côncavo (a
 * axila da manga é côncava), o que um `<rect rx>` não resolve.
 */
export function poligono(pts: Ponto[], raio: number): string {
  const n = pts.length;
  let d = "";

  for (let i = 0; i < n; i++) {
    const ant = pts[(i - 1 + n) % n];
    const at = pts[i];
    const prox = pts[(i + 1) % n];

    const recuar = (de: Ponto): Ponto => {
      const dx = de[0] - at[0];
      const dy = de[1] - at[1];
      const len = Math.hypot(dx, dy) || 1;
      const r = Math.min(raio, len / 2);
      return [at[0] + (dx / len) * r, at[1] + (dy / len) * r];
    };

    const entra = recuar(ant);
    const sai = recuar(prox);

    d += i === 0 ? `M ${par(entra)} ` : `L ${par(entra)} `;
    d += `Q ${n1(at[0])} ${n1(at[1])} ${par(sai)} `;
  }

  return d + "Z";
}

/** Uma casa decimal. Mais que isso é peso de arquivo sem ganho visual. */
export function n1(v: number): string {
  return v.toFixed(1);
}

export function par(p: Ponto): string {
  return `${n1(p[0])} ${n1(p[1])}`;
}

/** Elipse como path, para tudo sair no mesmo formato de elemento. */
export function elipse(cx: number, cy: number, rx: number, ry: number): string {
  return (
    `M ${n1(cx - rx)} ${n1(cy)} ` +
    `a ${n1(rx)} ${n1(ry)} 0 1 0 ${n1(rx * 2)} 0 ` +
    `a ${n1(rx)} ${n1(ry)} 0 1 0 ${n1(-rx * 2)} 0 Z`
  );
}

/**
 * Emite um elemento de desenho.
 *
 * `classes` carrega a cor (`c-pele`) e o acabamento (`contorno`). A cor nunca
 * vai no elemento: ela vem da classe, que lê a custom property. Ver
 * `palette.ts` e o defeito de colisão que isso evita.
 */
export function peca(classes: string, d: string): string {
  return `<path class="${classes}" d="${d}"/>`;
}
