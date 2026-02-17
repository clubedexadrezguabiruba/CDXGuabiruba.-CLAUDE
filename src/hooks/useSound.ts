"use client";

import { useEffect, useCallback } from "react";
import { soundManager, type SoundName } from "@/lib/sounds/soundManager";
import { useUser } from "./useUser";

export function useSound() {
  const { profile } = useUser();

  useEffect(() => {
    soundManager.init();
  }, []);

  useEffect(() => {
    soundManager.setMuted(profile?.sound_muted ?? false);
  }, [profile?.sound_muted]);

  const play = useCallback((name: SoundName) => {
    soundManager.play(name);
  }, []);

  return { play, isMuted: soundManager.isMuted() };
}
