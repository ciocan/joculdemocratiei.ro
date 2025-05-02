import { setup, assign, type ActorRefFrom, fromPromise } from "xstate";

import { logger } from "@joculdemocratiei/utils";
import type { GamePhase, GamePlayer, RoundData, WsStatePayload } from "@joculdemocratiei/utils";

export type WsInbound = WsStatePayload;

export interface RoomMachineContext {
  wsUrl?: string;
  ws?: WebSocket;
  candidateId?: string;
  currentUserId?: string;
  players: GamePlayer[];
  phase: GamePhase;
  error?: Event;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  currentRound: number;
  totalRounds: number;
  roundsData: RoundData[];
  countdownEndTime?: number;
  selectedAnswerId?: string;
}

export type RoomMachineEvent =
  | { type: "CONNECT"; wsUrl: string; candidateId?: string; currentUserId?: string }
  | { type: "WS_OPEN"; ws: WebSocket; data: { type: "connected" } }
  | { type: "WS_CLOSE" }
  | { type: "WS_MESSAGE"; data: WsInbound }
  | { type: "WS_ERROR"; error: Event }
  | { type: "SEND_MESSAGE"; message: string }
  | { type: "SELECT_DEBATE_ANSWER"; answerId: string }
  | { type: "REMOVE_PLAYER" }
  | { type: "VOTE"; targetPlayerId: string; vote: "agree" | "neutral" | "disagree" }
  | { type: "RECONNECT" };

function isWsStatePayload(msg: unknown): msg is WsStatePayload {
  return (
    typeof msg === "object" &&
    msg !== null &&
    (msg as WsStatePayload).type === "state" &&
    Array.isArray((msg as WsStatePayload).players)
  );
}

const openSocket = fromPromise(
  async ({
    input,
  }: { input: { context: RoomMachineContext; sendBack: (event: RoomMachineEvent) => void } }) => {
    const { context, sendBack } = input;

    if (!context.wsUrl) {
      return null;
    }

    const ws = new WebSocket(context.wsUrl);

    ws.onopen = () => {
      sendBack({ type: "WS_OPEN", ws, data: { type: "connected" } });
    };
    ws.onclose = () => {
      sendBack({ type: "WS_CLOSE" });
    };
    ws.onerror = (event) => {
      sendBack({ type: "WS_ERROR", error: event });
    };
    ws.onmessage = (event) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
        if (isWsStatePayload(parsed)) {
          sendBack({ type: "WS_MESSAGE", data: parsed });
        }
      } catch (error) {
        logger.error("[Room] onmessage: error", error);
      }
    };

    return ws;
  },
);

export const roomMachine = setup({
  types: {
    context: {} as RoomMachineContext,
    events: {} as RoomMachineEvent,
  },

  actions: {
    setWsUrl: assign({
      wsUrl: ({ context, event }) => (event.type === "CONNECT" ? event.wsUrl : context.wsUrl),
    }),

    setCandidateId: assign({
      candidateId: ({ context, event }) =>
        event.type === "CONNECT" ? event.candidateId : context.candidateId,
    }),

    setCurrentUserId: assign({
      currentUserId: ({ context, event }) =>
        event.type === "CONNECT" ? event.currentUserId : context.currentUserId,
    }),

    resetContext: assign({
      wsUrl: () => undefined,
      ws: () => undefined,
      players: () => [],
      phase: () => "lobby" as GamePhase,
      reconnectAttempts: () => 0,
      currentRound: () => 0,
      totalRounds: () => 3,
      roundsData: () => [],
      selectedAnswerId: () => undefined,
      countdownEndTime: () => undefined,
    }),

    setError: assign({
      error: ({ context, event }) => (event.type === "WS_ERROR" ? event.error : context.error),
    }),

    updatePlayers: assign({
      players: ({ context, event }) =>
        event.type === "WS_MESSAGE" ? event.data.players : context.players,
    }),

    updatePhase: assign({
      phase: ({ context, event }) =>
        event.type === "WS_MESSAGE" && event.data.phase ? event.data.phase : context.phase,
    }),

    setWebSocket: assign({
      ws: ({ context, event }) => {
        if (event.type === "WS_OPEN") {
          return (event as { type: "WS_OPEN"; ws: WebSocket }).ws;
        }
        return context.ws;
      },
    }),

    sendMessage: ({ context, event }) => {
      if (event.type === "SEND_MESSAGE" && context.ws && context.ws.readyState === WebSocket.OPEN) {
        context.ws.send(event.message);
      }
    },

    sendCandidateIdMessage: ({ context }) => {
      if (context.ws && context.ws.readyState === WebSocket.OPEN && context.candidateId) {
        const message = JSON.stringify({ type: "candidate", id: context.candidateId });
        context.ws.send(message);
      } else {
        logger.error(
          "[App:roomMachine] Cannot send candidateId via action - missing data or WebSocket not open",
        );
      }
    },

    sendPlayerRemovalMessage: ({ context }) => {
      if (context.ws && context.ws.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({ type: "remove_player" });
        context.ws.send(message);
      } else {
        logger.error(
          "[App:roomMachine] Cannot send player removal message - missing data or WebSocket not open",
        );
      }
    },

    incrementReconnectAttempts: assign({
      reconnectAttempts: ({ context }) => context.reconnectAttempts + 1,
    }),

    resetReconnectAttempts: assign({
      reconnectAttempts: () => 0,
    }),

    removeCurrentUser: assign({
      players: ({ context }) => {
        if (!context.currentUserId) {
          return context.players;
        }
        return context.players.filter((player) => player.playerId !== context.currentUserId);
      },
    }),

    updateCountdownEndTime: assign({
      countdownEndTime: ({ context, event }) =>
        event.type === "WS_MESSAGE" && event.data.countdownEndTime
          ? event.data.countdownEndTime
          : context.countdownEndTime,
    }),

    updateCurrentRound: assign({
      currentRound: ({ context, event }) =>
        event.type === "WS_MESSAGE" && event.data.currentRound !== undefined
          ? event.data.currentRound
          : context.currentRound,
    }),

    updateTotalRounds: assign({
      totalRounds: ({ context, event }) =>
        event.type === "WS_MESSAGE" && event.data.totalRounds !== undefined
          ? event.data.totalRounds
          : context.totalRounds,
    }),

    updateRoundsData: assign({
      roundsData: ({ context, event }) => {
        if (event.type === "WS_MESSAGE" && event.data.roundsData) {
          return event.data.roundsData;
        }

        return context.roundsData;
      },
    }),

    selectDebateAnswer: assign({
      selectedAnswerId: ({ context, event }) => {
        if (
          event.type === "WS_MESSAGE" &&
          event.data.currentRound &&
          event.data.roundsData[event.data.currentRound]
        ) {
          return event.data.roundsData[event.data.currentRound].answerId;
        }
        return context.selectedAnswerId;
      },
    }),
  },

  actors: {
    openSocket,
  },
}).createMachine({
  id: "room",
  initial: "idle",
  context: {
    wsUrl: undefined,
    ws: undefined,
    candidateId: undefined,
    currentUserId: undefined,
    players: [],
    phase: "lobby",
    error: undefined,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    currentRound: 0,
    totalRounds: 3,
    roundsData: [],
    countdownEndTime: undefined,
    selectedAnswerId: undefined,
  },

  states: {
    idle: {
      on: {
        CONNECT: {
          target: "connecting",
          actions: ["setWsUrl", "setCandidateId", "setCurrentUserId"],
        },
      },
    },
    connecting: {
      invoke: {
        src: "openSocket",
        input: ({ context, self }) => ({
          context,
          sendBack: (event: RoomMachineEvent) => self.send(event),
        }),
      },
      on: {
        WS_OPEN: {
          target: "online.lobby",
          actions: ["setWebSocket", "sendCandidateIdMessage", "resetReconnectAttempts"],
        },
        WS_CLOSE: [
          {
            guard: ({ context }) => context.reconnectAttempts < context.maxReconnectAttempts,
            target: "reconnecting",
            actions: ["incrementReconnectAttempts", "removeCurrentUser"],
          },
          {
            target: "idle",
            actions: ["resetContext", "removeCurrentUser"],
          },
        ],
        WS_MESSAGE: {
          actions: ({ event }) => {
            const actions = ["updatePlayers", "updatePhase"];
            if (event.type === "WS_MESSAGE" && event.data.phase === "lobby") {
              actions.push("updateCountdownEndTime");
            }
            return actions;
          },
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
      initial: "lobby",
      states: {
        lobby: {
          on: {
            SEND_MESSAGE: {
              actions: "sendMessage",
            },
            REMOVE_PLAYER: {
              actions: "sendPlayerRemovalMessage",
            },
          },
        },
        debate: {
          on: {
            SEND_MESSAGE: {
              actions: "sendMessage",
            },
            REMOVE_PLAYER: {
              actions: "sendPlayerRemovalMessage",
            },
            SELECT_DEBATE_ANSWER: {
              actions: "selectDebateAnswer",
            },
          },
        },
        voting: {
          on: {
            SEND_MESSAGE: {
              actions: "sendMessage",
            },
            REMOVE_PLAYER: {
              actions: "sendPlayerRemovalMessage",
            },
            VOTE: {
              actions: ({ context, event }) => {
                if (context.ws && context.ws.readyState === WebSocket.OPEN) {
                  const message = JSON.stringify({
                    type: "vote",
                    targetPlayerId: event.targetPlayerId,
                    vote: event.vote,
                  });
                  context.ws.send(message);
                }
              },
            },
          },
        },
        results: {
          on: {
            SEND_MESSAGE: {
              actions: "sendMessage",
            },
          },
        },
      },
      on: {
        WS_MESSAGE: [
          {
            guard: ({ event }: { event: RoomMachineEvent & { type: "WS_MESSAGE" } }) =>
              event.data.phase === "lobby",
            target: ".lobby" as const,
            actions: [
              "updatePlayers",
              "updatePhase",
              "updateCountdownEndTime",
              "updateCurrentRound",
              "updateTotalRounds",
            ] as const,
          },
          {
            guard: ({ event }: { event: RoomMachineEvent & { type: "WS_MESSAGE" } }) =>
              event.data.phase === "debate",
            target: ".debate" as const,
            actions: [
              "updatePlayers",
              "updatePhase",
              "updateCountdownEndTime",
              "updateCurrentRound",
              "updateRoundsData",
            ] as const,
          },
          {
            guard: ({ event }: { event: RoomMachineEvent & { type: "WS_MESSAGE" } }) =>
              event.data.phase === "voting",
            target: ".voting" as const,
            actions: [
              "updatePlayers",
              "updatePhase",
              "updateCountdownEndTime",
              "updateCurrentRound",
              "updateRoundsData",
            ] as const,
          },
          {
            guard: ({ event }: { event: RoomMachineEvent & { type: "WS_MESSAGE" } }) =>
              event.data.phase === "results",
            target: ".results" as const,
            actions: [
              "updatePlayers",
              "updatePhase",
              "updateCountdownEndTime",
              "updateCurrentRound",
              "updateRoundsData",
            ] as const,
          },
        ],
        WS_CLOSE: [
          {
            guard: ({ context }) => context.reconnectAttempts < context.maxReconnectAttempts,
            target: "reconnecting",
            actions: ["incrementReconnectAttempts", "removeCurrentUser"],
          },
          {
            target: "idle",
            actions: ["resetContext", "removeCurrentUser"],
          },
        ],
        WS_ERROR: {
          actions: "setError",
        },
        SEND_MESSAGE: {
          actions: "sendMessage",
        },
      },
    },
  },
});

export type RoomActor = ActorRefFrom<typeof roomMachine>;
