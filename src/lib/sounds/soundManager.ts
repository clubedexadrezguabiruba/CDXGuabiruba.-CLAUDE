import { Howl } from "howler";

type SoundName =
  | "move"
  | "capture"
  | "check"
  | "wrong"
  | "streak"
  | "rush-tick"
  | "rush-gameover"
  | "victory"
  | "defeat";

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
};

class SoundManager {
  private sounds: Map<SoundName, Howl> = new Map();
  private muted = false;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;
    for (const [name, src] of Object.entries(SOUND_FILES)) {
      this.sounds.set(
        name as SoundName,
        new Howl({ src: [src], preload: true, volume: 0.7 })
      );
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted() {
    return this.muted;
  }

  play(name: SoundName) {
    if (this.muted) return;
    if (!this.initialized) this.init();
    this.sounds.get(name)?.play();
  }
}

export const soundManager = new SoundManager();
export type { SoundName };
