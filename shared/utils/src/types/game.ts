import type { DebateTopic } from "@/debate-topics";

export type GamePhase = "lobby" | "debate" | "voting" | "results";

export type Vote = "agree" | "neutral" | "disagree";

export type Score = {
  influence: number;
  empathy: number;
  harmony: number;
};

export type PlayerScore = Record<string, Score>;

export type RoundData = {
  debateTopic: DebateTopic;
  debateAnswers: Record<string, GameMessage[]>;
  playerAnswers: Record<string, string>; // playerId -> answerId
  answerTexts: Record<string, string>; // answerId -> answer text
  answerId?: string;
  playerVotes: Record<string, Record<string, Vote>>; // voterId -> targetPlayerId -> vote
  playerScores: PlayerScore; // playerId -> scores
  cumulativeScores: PlayerScore; // playerId -> cumulative scores
};

export type GameMessage = {
  id: string;
  text: string;
  isRisky: boolean;
  source?: string;
};

export type GamePlayer = {
  playerId: string;
  name: string;
  county: string;
  countyCode: string;
  city: string;
  candidateId?: string;
  selectedMessageId?: string;
  votedForMessageId?: string;
  isReady?: boolean;
};

export interface WsStatePayload {
  type: "state";
  players: GamePlayer[];
  phase?: GamePhase;
  currentRound?: number;
  totalRounds?: number;
  countdownEndTime?: number;
  roundsData: RoundData[];
}
