import type { Env } from "../index";
import { queryAnalyticsEngine } from "./utils";

export async function getUserLeaderboardData(env: Env, userId: string) {
  const query = `
    SELECT 
      double1 as influence,
      double2 as empathy,
      double3 as harmony,
      double4 as totalScore,
      double5 as agreeVotes,
      double6 as neutralVotes,
      double7 as disagreeVotes,
      blob1 as roomId,
      blob2 as playerId,
      blob3 as playerName,
      blob4 as answerId,
      blob5 as candidateId,
      blob6 as roundNumber,
      blob7 as answer,
      blob8 as topicId,
      blob9 as question
    FROM jd_leaderboard_${env.ENVIRONMENT}
    WHERE index1 = 'round:${userId}'
    ORDER BY roundNumber
  `;

  return queryAnalyticsEngine(env, query);
}

export async function getUserFinalLeaderboardData(env: Env, userId: string) {
  const query = `
    SELECT 
      double1 as influence,
      double2 as empathy,
      double3 as harmony,
      double4 as totalScore,
      double5 as totalPlayers,
      blob1 as roomId,
      blob2 as playerId,
      blob3 as playerName,
      blob4 as candidateId,
      blob5 as rank
    FROM jd_leaderboard_${env.ENVIRONMENT}
    WHERE index1 = 'final:${userId}'
    LIMIT 1
  `;

  return queryAnalyticsEngine(env, query);
}

export async function testQuery(query: string | undefined, env: Env) {
  return queryAnalyticsEngine(env, query || "SHOW TABLES");
}
