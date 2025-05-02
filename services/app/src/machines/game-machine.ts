import { setup, assign } from "xstate";

import { openSocket } from "@/lib/websocket";

export interface GameMachineContext {
  wsUrl?: string;
  ws?: WebSocket;
  gameStats: {
    onlinePlayersCount: number;
    activeRoomsCount: number;
  };
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  error?: Event;
}

export type GameMachineEvent =
  | { type: "CONNECT"; wsUrl: string }
  | { type: "WS_OPEN"; ws: WebSocket; data: { type: "connected" } }
  | { type: "WS_CLOSE" }
  | { type: "WS_MESSAGE"; data: { type: "GAME_STATS"; stats: GameMachineContext["gameStats"] } }
  | { type: "WS_ERROR"; error: Event }
  | { type: "RECONNECT" };

export const gameMachine = setup({
  types: {
    context: {} as GameMachineContext,
    events: {} as GameMachineEvent,
  },

  actions: {
    setWsUrl: assign({
      wsUrl: ({ context, event }: { context: GameMachineContext; event: GameMachineEvent }) =>
        event.type === "CONNECT" ? event.wsUrl : context.wsUrl,
    }),

    resetContext: assign({
      wsUrl: () => undefined,
      ws: () => undefined,
      gameStats: () => ({
        onlinePlayersCount: 0,
        activeRoomsCount: 0,
      }),
      reconnectAttempts: () => 0,
      error: () => undefined,
    }),

    setError: assign({
      error: ({ context, event }: { context: GameMachineContext; event: GameMachineEvent }) =>
        event.type === "WS_ERROR" ? event.error : context.error,
    }),

    setWebSocket: assign({
      ws: ({ context, event }: { context: GameMachineContext; event: GameMachineEvent }) => {
        if (event.type === "WS_OPEN") {
          return (event as { type: "WS_OPEN"; ws: WebSocket }).ws;
        }
        return context.ws;
      },
    }),

    updateGameStats: assign({
      gameStats: ({ context, event }: { context: GameMachineContext; event: GameMachineEvent }) => {
        return event.type === "WS_MESSAGE" ? event.data.stats : context.gameStats;
      },
    }),

    incrementReconnectAttempts: assign({
      reconnectAttempts: ({ context }: { context: GameMachineContext }) =>
        context.reconnectAttempts + 1,
    }),

    resetReconnectAttempts: assign({
      reconnectAttempts: () => 0,
    }),

    sendMessage: ({ context }) => {
      if (context.ws && context.ws.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({ type: "connected" });
        context.ws.send(message);
      }
    },
  },
  actors: { openSocket },
}).createMachine({
  id: "game",
  initial: "idle",
  context: {
    wsUrl: undefined,
    ws: undefined,
    gameStats: {
      onlinePlayersCount: 0,
      activeRoomsCount: 0,
    },
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    error: undefined,
  },

  states: {
    idle: {
      on: {
        CONNECT: {
          target: "connecting",
          actions: ["setWsUrl"],
        },
      },
    },
    connecting: {
      invoke: {
        src: "openSocket",
        input: ({ context, self }) => ({
          context,
          sendBack: (event: GameMachineEvent) => self.send(event),
        }),
      },
      on: {
        WS_OPEN: {
          target: "online",
          actions: ["setWebSocket", "resetReconnectAttempts", "sendMessage"],
        },
        WS_CLOSE: [
          {
            guard: ({ context }) => context.reconnectAttempts < context.maxReconnectAttempts,
            target: "reconnecting",
            actions: ["incrementReconnectAttempts"],
          },
          {
            target: "idle",
            actions: ["resetContext"],
          },
        ],
        WS_MESSAGE: {
          actions: "updateGameStats",
        },
        WS_ERROR: {
          target: "idle",
          actions: "setError",
        },
      },
    },
    reconnecting: {
      after: {
        3000: {
          target: "connecting",
        },
      },
      on: {
        RECONNECT: {
          target: "connecting",
        },
      },
    },
    online: {
      on: {
        WS_CLOSE: [
          {
            guard: ({ context }) => context.reconnectAttempts < context.maxReconnectAttempts,
            target: "reconnecting",
            actions: ["incrementReconnectAttempts"],
          },
          {
            target: "idle",
            actions: ["resetContext"],
          },
        ],
        WS_MESSAGE: {
          actions: "updateGameStats",
        },
        WS_ERROR: {
          actions: "setError",
        },
      },
    },
  },
});
