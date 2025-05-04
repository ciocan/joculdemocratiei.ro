import { useEffect, useRef } from "react";
import { useSoundEffects } from "./use-sound-effects";

/**
 * Hook to play sounds when players select answers in the debate phase
 * @param playerAnswers - The current player answers object from the game state
 * @param currentUserId - The current user's ID
 */
export function useAnswerSounds(
  playerAnswers: Record<string, string>,
  currentUserId?: string
) {
  const { playPlayerVotedSound } = useSoundEffects();
  const prevAnswersCountRef = useRef<number>(0);
  
  useEffect(() => {
    // Calculate the total number of answers
    const totalAnswers = Object.keys(playerAnswers || {}).length;
    
    // Skip the first render or if no answers yet
    if (prevAnswersCountRef.current === 0 && totalAnswers === 0) {
      prevAnswersCountRef.current = totalAnswers;
      return;
    }
    
    // Check if the number of answers has increased
    if (totalAnswers > prevAnswersCountRef.current) {
      // Check if the new answers are from other players (not the current user)
      const otherPlayersAnswered = Object.keys(playerAnswers || {}).some(
        (playerId) => playerId !== currentUserId
      );
      
      // Play sound if other players answered
      if (otherPlayersAnswered) {
        playPlayerVotedSound();
      }
    }
    
    // Update the previous answers count
    prevAnswersCountRef.current = totalAnswers;
  }, [playerAnswers, currentUserId, playPlayerVotedSound]);
}
