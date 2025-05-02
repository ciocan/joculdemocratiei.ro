import type { GameMachineContext, GameMachineEvent } from "@/machines/game-machine";
import { logger } from "@joculdemocratiei/utils";
import { fromPromise } from "xstate";

export const openSocket = fromPromise(
  async ({
    input,
  }: { input: { context: GameMachineContext; sendBack: (event: GameMachineEvent) => void } }) => {
    const { context, sendBack } = input;

    if (!context.wsUrl) {
      throw new Error("WebSocket URL is required");
    }

    const ws = new WebSocket(context.wsUrl);

    ws.onopen = () => {
      sendBack({ type: "WS_OPEN", ws, data: { type: "connected" } });
    };

    ws.onclose = () => {
      sendBack({ type: "WS_CLOSE" });
    };

    ws.onerror = (error) => {
      logger.error("[Game] WebSocket error", error);
      sendBack({ type: "WS_ERROR", error });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        sendBack({ type: "WS_MESSAGE", data });
      } catch (error) {
        logger.error("[Game] Failed to parse WebSocket message:", error);
      }
    };

    return ws;
  },
);
