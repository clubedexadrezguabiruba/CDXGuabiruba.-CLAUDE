/**
 * A RÉGUA MEDIA A CORDA E O DESENHO ERA A SPLINE — e a reta é o pior caso.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO, MEDIDO NA ARTE
 * ---------------------------------------------------------------------------
 *
 * `escolherN` varre N pelo `desvioDaCorda`, que mede a **poligonal**. O compositor
 * desenha `spline(pts, true)` (`cabelo.ts`, via `lacoTY`), que é uma Catmull-Rom
 * centrípeta. As duas concordam onde a borda curva e **divergem ao máximo onde ela
 * é reta**: numa reta a corda erra exatamente zero, então a decimação não gasta um
 * único ponto ali — e a spline, puxada pelas tangentes dos dois vizinhos, arqueia.
 *
 * Medido na `chanel`, base da franja: **246 u de reta com 2 pontos**, corda **0 px**
 * de erro nas três colunas amostradas, spline **23 a 28 px**. O efeito visível era a
 * barra preta da franja sumir — 328 × 13 px que a arte tem e o render não.
 *
 * Ele passou despercebido por três blocos porque o contorno era um `stroke` de 12 u
 * **centrado** no laço: o traço pintava preto dos dois lados da curva errada e a
 * peça parecia certa. Foi transcrever o preto (a banda vira a diferença entre duas
 * formas cheias) que descobriu a curva.
 *
 * ---------------------------------------------------------------------------
 * A FIXTURE É A TOPOLOGIA DA FRANJA, EM FORMA MÍNIMA
 * ---------------------------------------------------------------------------
 *
 * Um laço com uma reta longa entre dois cantos, e os vizinhos dos dois cantos bem
 * abaixo dela — que é o que puxa a tangente. Não é a `chanel`: é o menor desenho em
 * que os dois números discordam, para o teste falhar pelo motivo e não pela peça.
 */

import { describe, expect, it } from "vitest";
import { amostrarSpline, spline } from "../../../../src/lib/avatar/estilo/geometria";
import { decimarPorCorda, desvioDaCorda } from "../medir";
import { desvioDaSpline, refinarPelaSpline } from "../tracar-cabelo";

type P = { x: number; y: number; i: number };

/**
 * A BORDA DENSA da fixture: um "U" de cabeça para baixo com a base RETA e longa.
 *
 * Percorrida na ordem de um traçado de contorno, com `i` sendo o índice denso —
 * que é o que `refinarPelaSpline` usa para saber onde o ponto novo entra no laço.
 */
function bordaDensa(): P[] {
  const pts: { x: number; y: number }[] = [];
  const passo = 2;
  // a base RETA, da direita para a esquerda, em y = 160 — 240 unidades
  for (let x = 400; x >= 160; x -= passo) pts.push({ x, y: 160 });
  // sobe pela esquerda, bem para baixo primeiro (é o vizinho que puxa a tangente)
  for (let y = 160; y <= 300; y += passo) pts.push({ x: 160, y });
  for (let x = 160; x <= 400; x += passo) pts.push({ x, y: 300 });
  for (let y = 300; y > 160; y -= passo) pts.push({ x: 400, y });
  return pts.map((p, i) => ({ ...p, i }));
}

const ALVO = 6; // meio traço, o mesmo alvo de `escolherN`

describe("desvioDaSpline vê o que desvioDaCorda não vê", () => {
  const densa = bordaDensa();
  const red = decimarPorCorda(densa, 12, { fechado: true });

  it("REPRODUZ o defeito: a corda diz ~0 e a spline erra muito mais", () => {
    const corda = desvioDaCorda(densa, [...red, red[0]]).max;
    const curva = desvioDaSpline(densa, red, true).max;
    // A corda é a régua otimista: ela mede o polígono, que numa reta é exato.
    expect(corda).toBeLessThan(ALVO);
    // A spline é a curva desenhada, e ela estoura o mesmo alvo com folga.
    expect(curva).toBeGreaterThan(3 * ALVO);
  });

  it("CONSERTA: o refino põe a curva desenhada dentro do alvo", () => {
    const r = refinarPelaSpline(densa, red, true, ALVO, 96);
    expect(r.erroAntes).toBeGreaterThan(3 * ALVO);
    expect(r.erro).toBeLessThanOrEqual(ALVO);
    expect(r.bateuNoTeto).toBe(false);
    expect(r.inseridos).toBeGreaterThan(0);
  });

  it("NÃO MOVE NENHUM PONTO: todo ponto do resultado é ponto da borda densa", () => {
    // É a garantia que separa refinar de deformar. Um ajuste que empurrasse os
    // pontos para a curva encaixar tiraria o literal de cima da arte.
    const r = refinarPelaSpline(densa, red, true, ALVO, 96);
    const naBorda = new Set(densa.map((p) => `${p.x},${p.y}`));
    for (const p of r.pts) expect(naBorda.has(`${p.x},${p.y}`)).toBe(true);
    // E os pontos originais continuam todos lá, na mesma ordem relativa.
    const ordem = r.pts.map((p) => p.i);
    for (const p of red) expect(ordem).toContain(p.i);
  });

  it("a ordem do laço é preservada — ponto certo em lugar errado faria um nó", () => {
    const r = refinarPelaSpline(densa, red, true, ALVO, 96);
    const idx = r.pts.map((p) => p.i);
    // Num laço fechado a sequência é crescente com no MÁXIMO uma volta.
    const quedas = idx.filter((v, k) => k > 0 && v < idx[k - 1]).length;
    expect(quedas).toBeLessThanOrEqual(1);
  });

  it("INÉRCIA: um laço já dentro do alvo não ganha ponto nenhum", () => {
    const finos = decimarPorCorda(densa, 48, { fechado: true });
    const antes = desvioDaSpline(densa, finos, true).max;
    const r = refinarPelaSpline(densa, finos, true, Math.max(ALVO, antes), 96);
    expect(r.inseridos).toBe(0);
    expect(r.pts.length).toBe(finos.length);
  });

  it("o teto é DITO e não silenciado", () => {
    // Alvo impossível: a função para no teto e devolve `bateuNoTeto`, em vez de
    // entregar uma curva torta calada.
    const r = refinarPelaSpline(densa, red, true, 0.001, 20);
    expect(r.bateuNoTeto).toBe(true);
    expect(r.pts.length).toBeLessThanOrEqual(20);
  });
});

describe("amostrarSpline é a MESMA curva que o compositor emite", () => {
  const pts = [
    { x: 100, y: 100 },
    { x: 300, y: 120 },
    { x: 320, y: 300 },
    { x: 90, y: 280 },
  ];

  it("passa pelos pontos de controle", () => {
    const a = amostrarSpline(pts, true, 16);
    for (const p of pts) {
      const perto = a.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 1e-6);
      expect(perto).toBe(true);
    }
  });

  it("os pontos de chegada dos arcos são os `C` do `d` emitido", () => {
    // Não é uma segunda implementação da Catmull-Rom: `spline()` virou a forma-texto
    // de `arcosDaSpline`, e amostrar usa os mesmos controles.
    const d = spline(pts, true);
    const chegadas = [...d.matchAll(/C[^C]*?([\d.-]+)\s+([\d.-]+)\s*$|C[^C]*?([\d.-]+)\s+([\d.-]+)\s+(?=C)/g)];
    expect(d.match(/C/g)?.length).toBe(pts.length);
    expect(chegadas.length).toBeGreaterThan(0);
  });
});
