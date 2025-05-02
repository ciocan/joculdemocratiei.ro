import { createStore } from "@xstate/store";
import { createBrowserInspector } from "@statelyai/inspect";

type GameContext = {
  candidateId?: string;
  showRoomOptions: boolean;
  isPrivate: boolean;
};

type CandidateEvent = {
  type: "setCandidateId";
  candidateId: string;
};

type RoomOptionsEvent = {
  type: "setShowRoomOptions";
  showRoomOptions: boolean;
};

type CreateRoomEvent = {
  type: "createRoom";
  isPrivate: boolean;
};

type SetIsPrivateEvent = {
  type: "setIsPrivate";
  isPrivate: boolean;
};

const STORAGE_KEY = "game-store-state";

const loadInitialState = (): GameContext => {
  if (typeof window === "undefined") {
    return {
      candidateId: undefined,
      showRoomOptions: false,
      isPrivate: false,
    };
  }

  try {
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (storedState) {
      return JSON.parse(storedState);
    }
  } catch (error) {
    console.error("Failed to load game state from localStorage:", error);
  }

  return {
    candidateId: undefined,
    showRoomOptions: false,
    isPrivate: false,
  };
};

const USE_INSPECT = false;

const inspector =
  USE_INSPECT && process.env.NODE_ENV === "development" && typeof window !== "undefined"
    ? createBrowserInspector()
    : null;

export const gameStore = createStore({
  context: loadInitialState(),
  emits: {
    stateChanged: (state: GameContext) => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
          console.error("Failed to save game state to localStorage:", error);
        }
      }
    },
  },
  on: {
    setCandidateId: (context: GameContext, event: CandidateEvent, enqueue) => {
      const newContext = { ...context, candidateId: event.candidateId };
      enqueue.emit.stateChanged(newContext);
      return newContext;
    },
    setShowRoomOptions: (context: GameContext, event: RoomOptionsEvent, enqueue) => {
      const newContext = { ...context, showRoomOptions: event.showRoomOptions };
      enqueue.emit.stateChanged(newContext);
      return newContext;
    },
    createRoom: (context: GameContext, event: CreateRoomEvent, enqueue) => {
      const newContext = { ...context, isPrivate: event.isPrivate };
      enqueue.emit.stateChanged(newContext);
      return newContext;
    },
    setIsPrivate: (context: GameContext, event: SetIsPrivateEvent, enqueue) => {
      const newContext = { ...context, isPrivate: event.isPrivate };
      enqueue.emit.stateChanged(newContext);
      return newContext;
    },
    changeCandidate: (_, __, enqueue) => {
      const newContext = { candidateId: undefined, showRoomOptions: false, isPrivate: false };
      enqueue.emit.stateChanged(newContext);
      return newContext;
    },
  },
});

if (inspector) {
  gameStore.inspect(inspector.inspect);
}
