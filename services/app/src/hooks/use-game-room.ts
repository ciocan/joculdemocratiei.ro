import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSelector } from "@xstate/store/react";
import ky from "ky";

import { env } from "@/env";
import { gameStore } from "@/stores/game-store";

export function useGameRoom() {
  const navigate = useNavigate();
  const {
    candidateId: selectedCandidateId,
    showRoomOptions,
    isPrivate,
  } = useSelector(gameStore, (state) => state.context);

  const handleContinue = useCallback(() => {
    gameStore.trigger.setShowRoomOptions({ showRoomOptions: true });
  }, []);

  const { mutate: createGameRoom, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("jd-token");
      return ky
        .post(`${env.VITE_API_URL}/create`, {
          headers: { Authorization: `Bearer ${token}` },
          json: { isPrivate },
        })
        .json<{ roomId: string }>();
    },
    onSuccess: ({ roomId }) => {
      navigate({ to: "/j/$roomId", params: { roomId } });
    },
    onError: (error) => {
      console.error("Failed to create room:", error);
      toast.error("Eroare la crearea camerei");
    },
  });

  const { mutate: joinRandomRoom, isPending: isJoining } = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("jd-token");
      return ky
        .post(`${env.VITE_API_URL}/join-random`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .json<{ roomId: string }>();
    },
    onSuccess: ({ roomId }) => {
      navigate({ to: "/j/$roomId", params: { roomId } });
    },
    onError: async (error) => {
      console.error("Failed to join room:", error);

      try {
        // @ts-expect-error - ky error response
        const errorData = await error.response?.json();
        if (errorData && typeof errorData === "object" && "error" in errorData) {
          toast.error(errorData.error as string);
          return;
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }

      toast.error("Eroare la alăturarea la o cameră");
    },
  });

  const joinGameRoom = useCallback(() => {
    joinRandomRoom();
  }, [joinRandomRoom]);

  const handleCreateRoom = useCallback(() => {
    createGameRoom();
  }, [createGameRoom]);

  const handleChangeCandidate = useCallback(() => {
    gameStore.trigger.changeCandidate();
  }, []);

  const handleSetCandidateId = useCallback((candidateId: string) => {
    gameStore.trigger.setCandidateId({ candidateId });
  }, []);

  const handleSetPrivateRoom = useCallback((checked: boolean) => {
    gameStore.trigger.createRoom({ isPrivate: checked });
  }, []);

  return {
    selectedCandidateId,
    showRoomOptions,
    isPrivate,
    isCreating,
    isJoining,
    handleContinue,
    handleCreateRoom,
    joinGameRoom,
    handleChangeCandidate,
    handleSetCandidateId,
    handleSetPrivateRoom,
  };
}
