import { useQuery } from "@tanstack/react-query";

import { fetchData } from "@/utils/lib";

export interface GameRound {
  roundNumber: number;
  influence: number;
  empathy: number;
  harmony: number;
  totalScore: number;
  agreeVotes: number;
  neutralVotes: number;
  disagreeVotes: number;
  debateTopic: string;
  debateQuestion: string;
  answer: string | null;
}

export interface GamePlayer {
  playerId: string;
  playerName: string;
  candidateId: string;
  city: string;
  county: string;
  countyCode: string;
  rounds: GameRound[];
}

export interface PlayerFinalScore {
  playerId: string;
  playerName: string;
  candidateId: string;
  influence: number;
  empathy: number;
  harmony: number;
  totalScore: number;
  rank: number;
  city: string;
  county: string;
  countyCode: string;
}

export interface GameDetails {
  roomId: string;
  players: GamePlayer[];
  finalScores: PlayerFinalScore[];
  totalRounds: number;
}

export function useGameDetails({ roomId }: { roomId: string }) {
  const {
    data: gameDetails,
    isLoading,
    error,
  } = useQuery({
    retry: 0,
    queryKey: ["gameDetails", roomId],
    queryFn: () => fetchData<GameDetails>("/api/get-game-details", { roomId }),
    enabled: !!roomId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    gameDetails,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
  };
}
