import { useEffect, useRef } from "react";
import type { GamePlayer } from "@joculdemocratiei/utils";
import { useSoundEffects } from "./use-sound-effects";

/**
 * Hook to play sounds when players join the lobby
 * Note: Player leave sounds are handled by usePlayerLeaveSounds
 */
export function usePlayerSounds(players: GamePlayer[], currentUserId?: string) {
  const { playPlayerJoinSound } = useSoundEffects();
  const prevPlayersRef = useRef<GamePlayer[]>([]);

  useEffect(() => {
    // Skip the first render
    if (prevPlayersRef.current.length === 0) {
      prevPlayersRef.current = players;
      return;
    }

    const prevPlayerIds = new Set(prevPlayersRef.current.map((p) => p.playerId));

    // Find players who joined (in current but not in previous)
    const joinedPlayers = players.filter((p) => !prevPlayerIds.has(p.playerId));

    // Play sounds for joined players (except for current user)
    if (joinedPlayers.length > 0) {
      const otherJoinedPlayers = joinedPlayers.filter((p) => p.playerId !== currentUserId);
      if (otherJoinedPlayers.length > 0) {
        playPlayerJoinSound();
      }
    }

    // Update the previous players reference
    prevPlayersRef.current = players;
  }, [players, currentUserId, playPlayerJoinSound]);
}
