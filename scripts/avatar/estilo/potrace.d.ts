/**
 * O `potrace` não publica tipos, e o `@types/potrace` não existe.
 *
 * Declarar só o que se usa é de propósito: um `declare module "potrace"` vazio
 * (`any` implícito) desligaria o `strict` justamente na fronteira em que a
 * geometria entra no repositório, e é ali que um parâmetro trocado sai como
 * forma plausível e errada.
 *
 * Os quatro parâmetros que importam estão comentados em `rotas/potrace.ts`.
 */
declare module "potrace" {
  export interface PotraceOptions {
    turnPolicy?: "black" | "white" | "left" | "right" | "minority" | "majority";
    turdSize?: number;
    alphaMax?: number;
    optCurve?: boolean;
    optTolerance?: number;
    threshold?: number;
    blackOnWhite?: boolean;
    color?: string;
    background?: string;
    width?: number | null;
    height?: number | null;
  }

  export class Potrace {
    constructor(options?: PotraceOptions);
    setParameters(options: PotraceOptions): void;
    loadImage(target: string | Buffer, callback: (err: Error | null) => void): void;
    getPathTag(fillColor?: string, scale?: { x: number; y: number }): string;
    getSVG(): string;
  }

  export class Posterizer {
    constructor(options?: PotraceOptions);
    loadImage(target: string | Buffer, callback: (err: Error | null) => void): void;
    getSVG(): string;
  }

  export function trace(
    file: string | Buffer,
    options: PotraceOptions | ((err: Error | null, svg: string) => void),
    callback?: (err: Error | null, svg: string) => void,
  ): void;
}
