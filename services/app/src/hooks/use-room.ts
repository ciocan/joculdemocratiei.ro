import { useMachine, useSelector } from "@xstate/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import ky from "ky";
import { useCountdown } from "usehooks-ts";
import { createBrowserInspector } from "@statelyai/inspect";
import { useNavigate } from "@tanstack/react-router";

import { logger } from "@joculdemocratiei/utils";

import { roomMachine } from "@/machines/room-machine";
import { useUserProfile } from "@/stores/user-store";
import { gameStore } from "@/stores/game-store";
import { env } from "@/env";

const USE_INSPECT = false;

const inspector =
  USE_INSPECT && process.env.NODE_ENV === "development" && typeof window !== "undefined"
    ? createBrowserInspector()
    : null;

export function useRoom(roomId: string) {
  const { user, isLoading: isUserLoading, isHydrated } = useUserProfile();
  const { candidateId, isPrivate } = useSelector(gameStore, (state) => state.context);
  const navigate = useNavigate();

  const [state, send] = useMachine(roomMachine, { inspect: inspector?.inspect });

  const countdownEndTime = state.context.countdownEndTime;

  const [countdown, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
    countStart: countdownEndTime ? Math.ceil((countdownEndTime - Date.now()) / 1000) : 0,
    intervalMs: 1000,
  });

  useEffect(() => {
    if (countdownEndTime && countdownEndTime > Date.now()) {
      resetCountdown();
      startCountdown();
    } else {
      stopCountdown();
      resetCountdown();
    }
  }, [countdownEndTime, startCountdown, stopCountdown, resetCountdown]);

  const { data, mutate, isPending } = useMutation({
    mutationKey: ["ws-url", roomId],
    mutationFn: async () => {
      if (!roomId) {
        return null;
      }
      const token = localStorage.getItem("jd-token");
      return ky
        .get(`${env.VITE_API_URL}/ws-url/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .json<{ wsUrl: string; error?: string }>();
    },
    onSuccess: (data) => {
      if (data?.wsUrl) {
        send({ type: "CONNECT", wsUrl: data.wsUrl, candidateId, currentUserId: user?.userId });
      }
    },
    onError: (error) => {
      logger.error("Failed to get ws-url:", error);
    },
  });

  useEffect(() => {
    if (user && roomId) {
      mutate();
    }
  }, [user, roomId, mutate]);

  const handleReady = () => {
    if (state.context.ws && state.context.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: "player_ready",
        playerId: user?.userId,
        isReady: true,
      });
      send({ type: "SEND_MESSAGE", message });
    }
  };

  const handleLeaveRoom = () => {
    if (state.context.ws && state.context.ws.readyState === WebSocket.OPEN) {
      send({ type: "REMOVE_PLAYER" });
    }
    navigate({ to: "/joc-nou" });
  };

  const handleNewGame = () => {
    navigate({ to: "/joc-nou" });
  };

  const handleNextRound = () => {
    if (state.context.ws && state.context.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: "next_round",
      });
      send({ type: "SEND_MESSAGE", message });
    }
  };

  const handleSelectAnswer = (answerId: string) => {
    const message = JSON.stringify({
      type: "debate_answer",
      answerId,
    });
    send({ type: "SEND_MESSAGE", message });
  };

  const handleVote = (targetPlayerId: string, vote: "agree" | "neutral" | "disagree") => {
    send({ type: "VOTE", targetPlayerId, vote });
  };

  const currentUser = state.context.players.find((p) => p.playerId === user?.userId);
  const isCurrentUserReady = Boolean(currentUser?.isReady);

  const isLoading = isPending || isUserLoading || !isHydrated;

  return {
    state,
    send,
    countdown,
    handleReady,
    handleLeaveRoom,
    handleSelectAnswer,
    handleVote,
    handleNewGame,
    handleNextRound,
    isCurrentUserReady,
    isLoading,
    isPrivate,
    players: state.context.players,
    wsUrl: data?.wsUrl,
    currentRound: state.context.currentRound,
    totalRounds: state.context.totalRounds,
    roundsData: state.context.roundsData,
    selectedAnswerId: state.context.selectedAnswerId,
  };
}
