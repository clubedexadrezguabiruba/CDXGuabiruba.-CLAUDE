import { useEffect } from "react";

interface UseArrowKeysOptions {
  onPrev: () => void;
  onNext: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  enabled?: boolean;
}

export function useArrowKeys({
  onPrev,
  onNext,
  onFirst,
  onLast,
  enabled = true,
}: UseArrowKeysOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          onNext();
          break;
        case "Home":
          if (onFirst) {
            e.preventDefault();
            onFirst();
          }
          break;
        case "End":
          if (onLast) {
            e.preventDefault();
            onLast();
          }
          break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onPrev, onNext, onFirst, onLast, enabled]);
}
