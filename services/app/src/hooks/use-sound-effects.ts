import { useCallback, useEffect, useRef } from "react";
import { useSoundSettings } from "@/contexts/sound-context";

export function useSoundEffects() {
  const { isMuted, volume } = useSoundSettings();

  const playerJoinSound = useRef<HTMLAudioElement | null>(null);
  const playerLeaveSound = useRef<HTMLAudioElement | null>(null);
  const playerLeaveRoomSound = useRef<HTMLAudioElement | null>(null);
  const nextPhaseSound = useRef<HTMLAudioElement | null>(null);
  const finalResultsSound = useRef<HTMLAudioElement | null>(null);
  const playerVotedSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        playerJoinSound.current = new Audio("/sounds/player-join.mp3");
        playerLeaveSound.current = new Audio("/sounds/player-leave.mp3");
        playerLeaveRoomSound.current = new Audio("/sounds/player-leave-room.mp3");
        nextPhaseSound.current = new Audio("/sounds/next-phase.mp3");
        finalResultsSound.current = new Audio("/sounds/final-results.mp3");
        playerVotedSound.current = new Audio("/sounds/player-voted.mp3");

        playerJoinSound.current.addEventListener("error", (e) =>
          console.error("Error loading player join sound:", e),
        );
        playerLeaveSound.current.addEventListener("error", (e) =>
          console.error("Error loading player leave sound:", e),
        );
        playerLeaveRoomSound.current.addEventListener("error", (e) =>
          console.error("Error loading player leave room sound:", e),
        );
        nextPhaseSound.current.addEventListener("error", (e) =>
          console.error("Error loading next phase sound:", e),
        );
        finalResultsSound.current.addEventListener("error", (e) =>
          console.error("Error loading final results sound:", e),
        );
        playerVotedSound.current.addEventListener("error", (e) =>
          console.error("Error loading player voted sound:", e),
        );

        playerJoinSound.current.load();
        playerLeaveSound.current.load();
        playerLeaveRoomSound.current.load();
        nextPhaseSound.current.load();
        finalResultsSound.current.load();
        playerVotedSound.current.load();
      } catch (error) {
        console.error("Error initializing sound effects:", error);
      }
    }

    return () => {
      playerJoinSound.current = null;
      playerLeaveSound.current = null;
      playerLeaveRoomSound.current = null;
      nextPhaseSound.current = null;
      finalResultsSound.current = null;
      playerVotedSound.current = null;
    };
  }, []);

  useEffect(() => {
    if (playerJoinSound.current) {
      playerJoinSound.current.volume = volume;
    }
    if (playerLeaveSound.current) {
      playerLeaveSound.current.volume = volume;
    }
    if (playerLeaveRoomSound.current) {
      playerLeaveRoomSound.current.volume = volume;
    }
    if (nextPhaseSound.current) {
      nextPhaseSound.current.volume = volume;
    }
    if (finalResultsSound.current) {
      finalResultsSound.current.volume = volume;
    }
    if (playerVotedSound.current) {
      playerVotedSound.current.volume = volume;
    }
  }, [volume]);

  const playPlayerJoinSound = useCallback(() => {
    if (playerJoinSound.current && !isMuted) {
      playerJoinSound.current.currentTime = 0;
      playerJoinSound.current.play().catch((error) => {
        console.error("Error playing join sound:", error);
      });
    }
  }, [isMuted]);

  const playPlayerLeaveSound = useCallback(() => {
    if (playerLeaveSound.current && !isMuted) {
      playerLeaveSound.current.currentTime = 0;
      playerLeaveSound.current.play().catch((error) => {
        console.error("Error playing leave sound:", error);
      });
    }
  }, [isMuted]);

  const playNextPhaseSound = useCallback(() => {
    if (nextPhaseSound.current && !isMuted) {
      nextPhaseSound.current.currentTime = 0;
      nextPhaseSound.current.play().catch((error) => {
        console.error("Error playing next phase sound:", error);
      });
    }
  }, [isMuted]);

  const playFinalResultsSound = useCallback(() => {
    if (finalResultsSound.current && !isMuted) {
      finalResultsSound.current.currentTime = 0;
      finalResultsSound.current.play().catch((error) => {
        console.error("Error playing final results sound:", error);
      });
    }
  }, [isMuted]);

  const playPlayerVotedSound = useCallback(() => {
    if (playerVotedSound.current && !isMuted) {
      playerVotedSound.current.currentTime = 0;
      playerVotedSound.current.play().catch((error) => {
        console.error("Error playing player voted sound:", error);
      });
    }
  }, [isMuted]);

  const playPlayerLeaveRoomSound = useCallback(() => {
    if (playerLeaveRoomSound.current && !isMuted) {
      playerLeaveRoomSound.current.currentTime = 0;
      playerLeaveRoomSound.current.play().catch((error) => {
        console.error("Error playing player leave room sound:", error);
      });
    }
  }, [isMuted]);

  return {
    playPlayerJoinSound,
    playPlayerLeaveSound,
    playNextPhaseSound,
    playFinalResultsSound,
    playPlayerVotedSound,
    playPlayerLeaveRoomSound,
  };
}
