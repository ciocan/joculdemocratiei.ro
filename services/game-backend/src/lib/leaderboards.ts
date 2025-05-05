import { queryAnalyticsEngine } from "./utils";

export async function getUserLeaderboardData(env: Env, userId: string) {
  const query = `
    SELECT
      index1,
      timestamp,
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
      blob9 as question,
      startsWith(index1, 'round:') as isRound
    FROM jd_leaderboard_${env.ENVIRONMENT}
    WHERE blob2 = '${userId}' and isRound = 1
    ORDER BY timestamp desc
    LIMIT 60
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

export async function getGameRoundData(env: Env, roomId: string) {
  const query = `
    SELECT
      timestamp,
      index1,
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
      blob9 as question,
      blob10 as city,
      blob11 as county,
      blob12 as countyCode,
      startsWith(index1, 'round:') as isRound
    FROM jd_leaderboard_${env.ENVIRONMENT}
    WHERE blob1 = '${roomId}' and isRound = 1
    ORDER BY timestamp
  `;

  const result = await queryAnalyticsEngine(env, query);
  return result;
}

export async function getGameFinalData(env: Env, roomId: string) {
  const query = `
    SELECT
      index1,
      double1 as influence,
      double2 as empathy,
      double3 as harmony,
      double4 as totalScore,
      double5 as totalPlayers,
      blob1 as roomId,
      blob2 as playerId,
      blob3 as playerName,
      blob4 as candidateId,
      blob5 as rank,
      blob6 as city,
      blob7 as county,
      blob8 as countyCode,
      startsWith(index1, 'final:') as isFinal
    FROM jd_leaderboard_${env.ENVIRONMENT}
    WHERE blob1 = '${roomId}' and isFinal = 1
  `;

  const result = await queryAnalyticsEngine(env, query);
  return result;
}

export async function testQuery(query: string | undefined, env: Env) {
  return queryAnalyticsEngine(env, query || "SHOW TABLES");
}
