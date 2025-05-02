import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AnyMachineSnapshot } from "xstate";
import { useParams } from "@tanstack/react-router";

import { useRoom } from "@/hooks/use-room";
import type { RoomMachineEvent } from "@/machines/room-machine";
import type { GamePlayer, RoundData } from "@joculdemocratiei/utils";

// Define the shape of the contexts
// 1. Room State Context - For the core state data
interface RoomStateContextType {
  // TODO: fix this later
  state: AnyMachineSnapshot;
  send: (event: RoomMachineEvent) => void;
  isLoading: boolean;
  isPrivate: boolean;
  players: GamePlayer[];
  wsUrl?: string;
  phase: string;
  currentUserId?: string;
  candidateId?: string;
}

// 2. Room Actions Context - For all the action handlers
interface RoomActionsContextType {
  handleReady: () => void;
  handleLeaveRoom: () => void;
  handleSelectAnswer: (answerId: string) => void;
  handleVote: (targetPlayerId: string, vote: "agree" | "neutral" | "disagree") => void;
  handleNextRound: () => void;
  handleNewGame: () => void;
}

interface RoomGameDataContextType {
  countdown: number;
  isCurrentUserReady: boolean;
  //
  currentRound: number;
  totalRounds: number;
  roundsData: RoundData[];
}

// Create the contexts with default undefined values
const RoomStateContext = createContext<RoomStateContextType | undefined>(undefined);
const RoomActionsContext = createContext<RoomActionsContextType | undefined>(undefined);
const RoomGameDataContext = createContext<RoomGameDataContextType | undefined>(undefined);

// Provider component
interface RoomProviderProps {
  children: ReactNode;
  roomId: string;
}

export function RoomProvider({ children, roomId }: RoomProviderProps) {
  // Use the existing hook to get all the room functionality
  const roomData = useRoom(roomId);

  // Memoize the state context value to prevent unnecessary re-renders
  const stateContextValue = useMemo(
    () => ({
      state: roomData.state,
      send: roomData.send,
      isLoading: roomData.isLoading,
      isPrivate: roomData.isPrivate,
      players: roomData.players,
      wsUrl: roomData.wsUrl,
      phase: roomData.state.context.phase,
      currentUserId: roomData.state.context.currentUserId,
      candidateId: roomData.state.context.candidateId,
    }),
    [
      roomData.state,
      roomData.send,
      roomData.isLoading,
      roomData.isPrivate,
      roomData.players,
      roomData.wsUrl,
    ],
  );

  // Memoize the actions context value
  const actionsContextValue = useMemo(
    () => ({
      handleReady: roomData.handleReady,
      handleLeaveRoom: roomData.handleLeaveRoom,
      handleSelectAnswer: roomData.handleSelectAnswer,
      handleVote: roomData.handleVote,
      handleNewGame: roomData.handleNewGame,
      handleNextRound: roomData.handleNextRound,
    }),
    [
      roomData.handleReady,
      roomData.handleLeaveRoom,
      roomData.handleSelectAnswer,
      roomData.handleVote,
      roomData.handleNewGame,
      roomData.handleNextRound,
    ],
  );

  // Memoize the game data context value
  const gameDataContextValue = useMemo(
    () => ({
      countdown: roomData.countdown,
      isCurrentUserReady: roomData.isCurrentUserReady,
      currentRound: roomData.state.context.currentRound,
      totalRounds: roomData.state.context.totalRounds,
      roundsData: roomData.state.context.roundsData,
    }),
    [
      roomData.countdown,
      roomData.isCurrentUserReady,
      roomData.state.context.currentRound,
      roomData.state.context.totalRounds,
      roomData.state.context.roundsData,
    ],
  );

  // Provide all the room data through nested contexts
  return (
    <RoomStateContext.Provider value={stateContextValue}>
      <RoomActionsContext.Provider value={actionsContextValue}>
        <RoomGameDataContext.Provider value={gameDataContextValue}>
          {children}
        </RoomGameDataContext.Provider>
      </RoomActionsContext.Provider>
    </RoomStateContext.Provider>
  );
}

// Custom hooks for consuming the contexts
export function useRoomState() {
  const context = useContext(RoomStateContext);
  if (context === undefined) {
    throw new Error("useRoomState must be used within a RoomProvider");
  }
  return context;
}

export function useRoomActions() {
  const context = useContext(RoomActionsContext);
  if (context === undefined) {
    throw new Error("useRoomActions must be used within a RoomProvider");
  }
  return context;
}

export function useRoomGameData() {
  const context = useContext(RoomGameDataContext);

  if (context === undefined) {
    throw new Error("useRoomGameData must be used within a RoomProvider");
  }

  const { currentRound, totalRounds, roundsData, isCurrentUserReady, countdown } = context;
  const gameData = roundsData[currentRound];

  return {
    ...gameData,
    isCurrentUserReady,
    countdown,
    currentRound,
    totalRounds,
    roundsData,
  };
}

// Specialized hooks for specific functionality
export function useRoomPlayers() {
  const { players, currentUserId } = useRoomState();
  return useMemo(() => ({ players, currentUserId }), [players, currentUserId]);
}

export function useRoomPhase() {
  const { state } = useRoomState();
  return state.context.phase;
}

export function useRoomDebate() {
  const { state } = useRoomState();
  const { debateTopic, debateAnswers, playerAnswers } = useRoomGameData();

  // const { debateTopic, debateAnswers, playerAnswers, selectedAnswerId } = useRoomGameData();
  const { handleSelectAnswer } = useRoomActions();
  const selectedAnswerId = state.context.selectedAnswerId;
  // We only want to expose the countdown for the debate phase
  const isDebatePhase = state.context.phase === "debate";

  return useMemo(
    () => ({
      debateTopic,
      debateAnswers,
      playerAnswers,
      selectedAnswerId,
      handleSelectAnswer,
      isDebatePhase,
    }),
    [
      debateTopic,
      debateAnswers,
      playerAnswers,
      selectedAnswerId,
      handleSelectAnswer,
      isDebatePhase,
    ],
  );
}

export function useRoomVoting() {
  const { debateTopic, debateAnswers, playerAnswers, answerTexts, playerVotes } = useRoomGameData();
  const { handleVote } = useRoomActions();
  const { state, candidateId } = useRoomState();

  // We only want to expose the voting phase data
  const isVotingPhase = state.context.phase === "voting";

  return useMemo(
    () => ({
      debateTopic,
      debateAnswers,
      playerAnswers,
      answerTexts,
      playerVotes,
      candidateId,
      handleVote,
      isVotingPhase,
    }),
    [
      debateTopic,
      debateAnswers,
      playerAnswers,
      answerTexts,
      playerVotes,
      candidateId,
      handleVote,
      isVotingPhase,
    ],
  );
}

export function useRoomLobby() {
  const { isCurrentUserReady, countdown } = useRoomGameData();
  const { handleReady } = useRoomActions();
  const { isPrivate } = useRoomState();

  return useMemo(
    () => ({
      isCurrentUserReady,
      countdown,
      handleReady,
      isPrivate,
    }),
    [isCurrentUserReady, countdown, handleReady, isPrivate],
  );
}

export function useRoomResults() {
  const { playerScores, currentRound, totalRounds, roundsData, cumulativeScores, countdown } =
    useRoomGameData();
  const { players, currentUserId } = useRoomState();
  const { handleNewGame, handleNextRound } = useRoomActions();

  return useMemo(
    () => ({
      playerScores,
      players,
      currentUserId,
      handleNewGame,
      handleNextRound,
      currentRound,
      totalRounds,
      roundsData,
      cumulativeScores,
      countdown,
    }),
    [
      playerScores,
      players,
      currentUserId,
      handleNewGame,
      handleNextRound,
      currentRound,
      totalRounds,
      roundsData,
      cumulativeScores,
      countdown,
    ],
  );
}

// For backward compatibility - combines all contexts
export function useRoomContext() {
  const state = useRoomState();
  const actions = useRoomActions();
  const gameData = useRoomGameData();

  return useMemo(
    () => ({
      ...state,
      ...actions,
      ...gameData,
    }),
    [state, actions, gameData],
  );
}

// Convenience wrapper that automatically gets roomId from route params
export function RoomProviderWithParams({ children }: { children: ReactNode }) {
  const { roomId } = useParams({ from: "/j/$roomId" });
  return <RoomProvider roomId={roomId}>{children}</RoomProvider>;
}
