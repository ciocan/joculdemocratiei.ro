import { useEffect, useRef } from "react";
import { useSoundEffects } from "./use-sound-effects";

/**
 * Hook to play sounds when other players vote
 * @param playerVotes - The current votes object from the game state
 * @param currentUserId - The current user's ID
 */
export function useVoteSounds(
  playerVotes: Record<string, Record<string, string>>,
  currentUserId?: string,
) {
  const { playPlayerVotedSound } = useSoundEffects();
  const prevTotalVotesRef = useRef<number>(0);

  useEffect(() => {
    // Calculate the total number of votes across all players
    let totalVotes = 0;

    // Count all votes from all players
    for (const voterId of Object.keys(playerVotes)) {
      totalVotes += Object.keys(playerVotes[voterId] || {}).length;
    }

    // Skip the first render or if no votes yet
    if (prevTotalVotesRef.current === 0 && totalVotes === 0) {
      prevTotalVotesRef.current = totalVotes;
      return;
    }

    // Check if the number of votes has increased
    if (totalVotes > prevTotalVotesRef.current) {
      // Check if the new votes are from other players (not the current user)
      const otherPlayersVoted = Object.keys(playerVotes).some(
        (voterId) =>
          voterId !== currentUserId && Object.keys(playerVotes[voterId] || {}).length > 0,
      );

      // Play sound if other players voted
      if (otherPlayersVoted) {
        playPlayerVotedSound();
      }
    }

    // Update the previous total votes count
    prevTotalVotesRef.current = totalVotes;
  }, [playerVotes, currentUserId, playPlayerVotedSound]);
}
