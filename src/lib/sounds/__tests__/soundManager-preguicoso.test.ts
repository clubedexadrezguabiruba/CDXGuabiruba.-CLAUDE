/**
 * O HOWLER SÓ ENTRA QUANDO ALGUÉM VAI TOCAR SOM.
 *
 * Ele são 36 KB e viajava no primeiro load de 11 rotas — entre elas /dashboard,
 * /turmas/[id] e /configuracoes, que não tocam nada. A causa era um
 * `import { Howl } from "howler"` no topo do soundManager: quem importasse o
 * módulo levava a biblioteca junto, tocasse som ou não.
 *
 * O rastro abaixo marca o instante em que o módulo `howler` é de fato avaliado.
 * Achado D9 de docs/achados.md.
 */
import { describe, it, expect, vi } from "vitest";

const rastro = vi.hoisted(() => ({
  carregado: false,
  tocados: [] as string[],
  montados: [] as string[],
}));

vi.mock("howler", () => {
  rastro.carregado = true;

  return {
    Howl: class HowlFalso {
      private src: string;
      constructor(opts: { src: string[] }) {
        this.src = opts.src[0];
        rastro.montados.push(this.src);
      }
      play() {
        rastro.tocados.push(this.src);
      }
    },
  };
});

describe("soundManager — carga do howler", () => {
  it("não carrega o howler só por importar o módulo, e carrega no primeiro play()", async () => {
    const { soundManager } = await import("@/lib/sounds/soundManager");

    // Importar o gerenciador não pode custar a biblioteca.
    expect(rastro.carregado).toBe(false);
    expect(rastro.montados).toEqual([]);

    soundManager.play("move");
    await soundManager.init(); // a mesma carga em voo, não uma segunda

    expect(rastro.carregado).toBe(true);
    expect(rastro.montados).toHaveLength(10);
    expect(rastro.tocados).toEqual(["/sounds/move.mp3"]);
  });

  it("no mudo não toca nem baixa nada", async () => {
    vi.resetModules();
    rastro.carregado = false;
    rastro.montados.length = 0;
    rastro.tocados.length = 0;

    const { soundManager } = await import("@/lib/sounds/soundManager");
    soundManager.setMuted(true);
    soundManager.play("capture");
    await new Promise((r) => setTimeout(r, 0));

    expect(rastro.carregado).toBe(false);
    expect(rastro.tocados).toEqual([]);
  });
});
