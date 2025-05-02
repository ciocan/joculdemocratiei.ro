import { useMachine } from "@xstate/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import ky from "ky";
import { createBrowserInspector } from "@statelyai/inspect";

import { logger } from "@joculdemocratiei/utils";
import { gameMachine } from "@/machines/game-machine";
import { env } from "@/env";

const USE_INSPECT = false;

const inspector =
  USE_INSPECT && process.env.NODE_ENV === "development" && typeof window !== "undefined"
    ? createBrowserInspector()
    : null;

export function useGame() {
  const [state, send] = useMachine(gameMachine, { inspect: inspector?.inspect });

  const { data, mutate, isPending } = useMutation({
    mutationKey: ["game-ws-url"],
    mutationFn: async () => {
      const token = localStorage.getItem("jd-token");
      return ky
        .get(`${env.VITE_API_URL}/game-ws-url`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .json<{ wsUrl: string; error?: string }>();
    },
    onSuccess: (data) => {
      if (data?.wsUrl) {
        send({ type: "CONNECT", wsUrl: data.wsUrl });
      }
    },
    onError: (error) => {
      logger.error("Failed to get game ws-url:", error);
    },
  });

  useEffect(() => {
    mutate();
  }, [mutate]);

  return {
    state,
    send,
    isLoading: isPending,
    gameStats: state.context.gameStats,
    wsUrl: data?.wsUrl,
  };
}
