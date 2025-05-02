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
  }
}

const apiHandler = eventHandler(async (event) => {
  const request = toWebRequest(event);
  request.context = event.context;
  const res = await defaultAPIFileRouteHandler({ request });
  return res;
});

export default apiHandler;
