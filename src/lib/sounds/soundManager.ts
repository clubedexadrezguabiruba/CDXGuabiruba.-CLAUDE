// `import type` NÃO emite código: o howler só entra no pacote pelo `import()`
// dentro do `init()`, lá embaixo. Ver D9 em docs/achados.md — estático, ele
// viajava em 11 rotas, entre elas /dashboard, /turmas/[id] e /configuracoes,
// que não tocam som nenhum.
import type { Howl } from "howler";

type SoundName =
  | "move"
  | "capture"
  | "check"
  | "wrong"
  | "streak"
  | "rush-tick"
  | "rush-gameover"
  | "victory"
  | "defeat"
  | "notify";

const SOUND_FILES: Record<SoundName, string> = {
  move: "/sounds/move.mp3",
  capture: "/sounds/capture.mp3",
  check: "/sounds/check.mp3",
  wrong: "/sounds/wrong.mp3",
  streak: "/sounds/streak.mp3",
  "rush-tick": "/sounds/rush-tick.mp3",
  "rush-gameover": "/sounds/rush-gameover.mp3",
  victory: "/sounds/victory.mp3",
  defeat: "/sounds/defeat.mp3",
  notify: "/sounds/notify.mp3",
};

class SoundManager {
  private sounds: Map<SoundName, Howl> = new Map();
  private muted = false;
  private initialized = false;
  /** A carga em voo, para dois `play()` seguidos não baixarem o howler duas vezes. */
  private carregando: Promise<void> | null = null;

  /**
   * Baixa o howler e monta os 10 sons. Idempotente, e agora assíncrono — o
   * `useSound` continua chamando no mount, então nas telas que tocam som o
   * chunk chega junto com a hidratação e o primeiro som não atrasa.
   */
  init(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    if (this.carregando) return this.carregando;

    this.carregando = import("howler").then(({ Howl }) => {
      for (const [name, src] of Object.entries(SOUND_FILES)) {
        this.sounds.set(
          name as SoundName,
          new Howl({ src: [src], preload: true, volume: 0.7 })
        );
      }
      this.initialized = true;
    });

    return this.carregando;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted() {
    return this.muted;
  }

  play(name: SoundName) {
    if (this.muted) return;

    if (!this.initialized) {
      // Primeiro som antes de o chunk chegar: espera a carga e toca em seguida.
      // O mudo é reconferido depois porque a carga leva tempo, e nesse intervalo
      // o aluno pode ter apertado o mudo.
      void this.init().then(() => {
        if (!this.muted) this.sounds.get(name)?.play();
      });
      return;
    }

    this.sounds.get(name)?.play();
  }
}

export const soundManager = new SoundManager();
export type { SoundName };
