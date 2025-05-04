import { useSoundEffects } from "./use-sound-effects";

/**
 * Hook to play a sound when a player leaves the room and ensure proper room leaving
 * @param handleLeaveRoom - The function to handle leaving the room
 */
export function useLeaveRoomSound(handleLeaveRoom?: () => void) {
  const { playPlayerLeaveRoomSound } = useSoundEffects();

  // Create a wrapped version of handleLeaveRoom that plays a sound
  const handleLeaveRoomWithSound = () => {
    // Play the leave room sound
    playPlayerLeaveRoomSound();

    // Small delay to allow the sound to start playing before navigation
    setTimeout(() => {
      if (handleLeaveRoom) {
        handleLeaveRoom();
      }
    }, 100);
  };

  return {
    handleLeaveRoomWithSound,
  };
}
