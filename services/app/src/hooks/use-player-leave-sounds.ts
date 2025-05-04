import { useEffect, useRef } from "react";
import type { GamePlayer } from "@joculdemocratiei/utils";
import { useSoundEffects } from "./use-sound-effects";

/**
 * Hook to play sounds when other players leave the room
 * @param players - The current list of players in the room
 * @param currentUserId - The current user's ID
 */
export function usePlayerLeaveSounds(players: GamePlayer[], currentUserId?: string) {
  const { playPlayerLeaveSound } = useSoundEffects();
  const prevPlayersRef = useRef<GamePlayer[]>([]);
  
  useEffect(() => {
    // Skip the first render
    if (prevPlayersRef.current.length === 0) {
      prevPlayersRef.current = players;
      return;
    }
    
    // Find players who left (in previous but not in current)
    const currentPlayerIds = new Set(players.map(p => p.playerId));
    const leftPlayers = prevPlayersRef.current.filter(p => !currentPlayerIds.has(p.playerId));
    
    // Only play sound if other players left (not the current user)
    if (leftPlayers.length > 0) {
      const otherPlayersLeft = leftPlayers.filter(p => p.playerId !== currentUserId);
      if (otherPlayersLeft.length > 0) {
        playPlayerLeaveSound();
      }
    }
    
    // Update the previous players reference
    prevPlayersRef.current = players;
  }, [players, currentUserId, playPlayerLeaveSound]);
}
