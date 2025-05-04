import { useRoomState } from "@/contexts/room-context";
import { useLeaveRoomSound } from "./use-leave-room-sound";

/**
 * Hook to handle leaving a room with proper cleanup
 * This hook should only be used within a RoomProvider context
 * @param handleLeaveRoom - The function to handle leaving the room
 */
export function useRoomLeave(handleLeaveRoom?: () => void) {
  const { state, send } = useRoomState();
  const { handleLeaveRoomWithSound } = useLeaveRoomSound(handleLeaveRoom);

  // Create a wrapped version that sends the REMOVE_PLAYER event and plays a sound
  const handleLeaveRoomWithCleanup = () => {
    // Send the REMOVE_PLAYER event to the room machine if we're in a room
    if (state.context.ws && state.context.ws.readyState === WebSocket.OPEN) {
      send({ type: "REMOVE_PLAYER" });
    }

    // Call the original handleLeaveRoomWithSound which plays the sound and handles navigation
    handleLeaveRoomWithSound();
  };

  return {
    handleLeaveRoomWithCleanup,
  };
}
