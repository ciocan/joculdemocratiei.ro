import { createContext, useContext, useMemo } from "react";
import { useGame as useGameHook } from "@/hooks/use-game";
import type { GameMachineEvent } from "@/machines/game-machine";
import type { AnyMachineSnapshot } from "xstate";

interface GameStateContextType {
  state: AnyMachineSnapshot;
  send: (event: GameMachineEvent) => void;
  isLoading: boolean;
  gameStats: {
    onlinePlayersCount: number;
    activeRoomsCount: number;
  };
}

const GameStateContext = createContext<GameStateContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const gameData = useGameHook();

  const stateContextValue = useMemo(
    () => ({
      state: gameData.state,
      send: gameData.send,
      isLoading: gameData.isLoading,
      gameStats: gameData.gameStats,
    }),
    [gameData.state, gameData.send, gameData.isLoading, gameData.gameStats],
  );

  return (
    <GameStateContext.Provider value={stateContextValue}>{children}</GameStateContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

export function useGameStats() {
  const { state } = useGame();

  return {
    onlinePlayersCount: state.context.gameStats.onlinePlayersCount || 0,
    activeRoomsCount: state.context.gameStats.activeRoomsCount || 0,
  };
}
