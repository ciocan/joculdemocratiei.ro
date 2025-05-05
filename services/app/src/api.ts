import { defaultAPIFileRouteHandler } from "@tanstack/react-start/api";
import { eventHandler, toWebRequest } from "vinxi/http";

declare global {
  interface GameBackendService {
    getUserLeaderboard: (userId: string) => Promise<{
      roundScores: {
        influence: number;
        empathy: number;
        harmony: number;
        totalScore: number;
        agreeVotes: number;
        neutralVotes: number;
        disagreeVotes: number;
        roundNumber: number;
        debateTopic: string;
        debateQuestion: string;
        answer: string | null;
      }[];
      cumulativeScores: {
        influence: number;
        empathy: number;
        harmony: number;
        totalScore: number;
        agreeVotes: number;
        neutralVotes: number;
        disagreeVotes: number;
        roundNumber: number;
        debateTopic: string;
        debateQuestion: string;
      }[];
      finalScores: {
        influence: number;
        empathy: number;
        harmony: number;
        totalScore: number;
        totalPlayers: number;
        rank: number;
      } | null;
    }>;

    getGameDetails: (roomId: string) => Promise<{
      roomId: string;
      players: {
        playerId: string;
        playerName: string;
        candidateId: string;
        city: string;
        county: string;
        countyCode: string;
        rounds: {
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
        }[];
      }[];
      finalScores: {
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
      }[];
      totalRounds: number;
    }>;
  }
}

const apiHandler = eventHandler(async (event) => {
  const request = toWebRequest(event);
  request.context = event.context;
  const res = await defaultAPIFileRouteHandler({ request });
  return res;
});

export default apiHandler;
