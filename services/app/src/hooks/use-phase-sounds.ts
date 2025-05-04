import { useEffect, useRef } from "react";
import type { GamePhase } from "@joculdemocratiei/utils";
import { useSoundEffects } from "./use-sound-effects";
import { useRoomResults } from "@/contexts/room-context";

export function usePhaseSounds(phase: GamePhase) {
  const { playNextPhaseSound } = useSoundEffects();
  const { isFinalRound } = useRoomResults();
  const prevPhaseRef = useRef<GamePhase | null>(null);
  const initialRenderRef = useRef(true);

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      prevPhaseRef.current = phase;
      return;
    }

    if (
      (phase === "debate" || phase === "voting" || phase === "results") &&
      !isFinalRound &&
      prevPhaseRef.current !== phase
    ) {
      setTimeout(() => {
        playNextPhaseSound();
      }, 100);
    }

    prevPhaseRef.current = phase;
  }, [phase, playNextPhaseSound, isFinalRound]);
}
