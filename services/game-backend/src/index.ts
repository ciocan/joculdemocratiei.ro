import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { sql, eq, and, lt, desc, count } from "drizzle-orm";

import {
  userProfileTable,
  gameHistoryTable,
  roomsTable,
  getUserProfileNamingData,
  type UserProfile,
  type RoomTable,
  type GameHistoryTable,
} from "@joculdemocratiei/utils";

import {
  getUserLeaderboardData,
  getUserFinalLeaderboardData,
  getGameRoundData,
  getGameFinalData,
  testQuery,
} from "./lib/leaderboards";

export default class GameBackend extends WorkerEntrypoint<Env> {
  private db = drizzle(this.env.DB);

  async getR2Data(key: keyof typeof getUserProfileNamingData): Promise<string> {
    try {
      const r2Object = await this.env.DATA_BUCKET.get(key);

      if (r2Object === null) {
        return getUserProfileNamingData[key];
      }
      const text = await r2Object.text();

      return text;
    } catch (error) {
      console.error(`Error loading ${key} from R2:`, error);
      return getUserProfileNamingData[key];
    }
  }

  createUser(user: UserProfile) {
    return this.db.insert(userProfileTable).values(user).returning();
  }

  async getActiveRoomsCount() {
    const [rooms] = await this.db
      .select({ count: count() })
      .from(roomsTable)
      .where(eq(roomsTable.isPrivate, false));
    return rooms.count;
  }

  async createRoom(room: Omit<RoomTable, "id">) {
    const created = await this.db.insert(roomsTable).values(room).returning();
    return created[0];
  }

  async joinRoom() {
    const room = await this.db
      .select()
      .from(roomsTable)
      .where(
        and(
          eq(roomsTable.isStarted, false),
          lt(roomsTable.seats, 6),
          eq(roomsTable.isPrivate, false),
        ),
      )
      .orderBy(desc(roomsTable.createdAt), desc(roomsTable.seats))
      .limit(1);

    return room[0]?.id;
  }

  async addSeat(roomId: string) {
    await this.db
      .update(roomsTable)
      .set({ seats: sql`seats + 1` })
      .where(and(eq(roomsTable.id, roomId), eq(roomsTable.isStarted, false)));
  }

  async removeSeat(roomId: string) {
    await this.db
      .update(roomsTable)
      .set({ seats: sql`seats - 1` })
      .where(and(eq(roomsTable.id, roomId), eq(roomsTable.isStarted, false)));
  }

  async getRoom(roomId: string) {
    const room = await this.db.select().from(roomsTable).where(eq(roomsTable.id, roomId));
    return room[0];
  }

  async deleteRoom(roomId: string) {
    await this.db.delete(roomsTable).where(eq(roomsTable.id, roomId));
  }

  async updateGameStarted(roomId: string, isStarted: boolean) {
    await this.db.update(roomsTable).set({ isStarted }).where(eq(roomsTable.id, roomId));
  }

  async archiveRoundData(roomData: Omit<GameHistoryTable, "id">) {
    await this.db.insert(gameHistoryTable).values(roomData);
  }

  async getRoundData(roomId: string, roundNumber: number) {
    const roundData = await this.db
      .select()
      .from(gameHistoryTable)
      .where(
        and(eq(gameHistoryTable.roomId, roomId), eq(gameHistoryTable.roundNumber, roundNumber)),
      );
    return roundData[0];
  }

  async getStalledRooms() {
    const rooms = await this.db
      .select({
        id: roomsTable.id,
      })
      .from(roomsTable)
      .where(lt(roomsTable.createdAt, sql`strftime('%s','now','utc','-30 minutes')`))
      .orderBy(desc(roomsTable.createdAt));

    return rooms;
  }

  addLeaderboardData(event: AnalyticsEngineDataPoint) {
    try {
      this.env.LEADERBOARD.writeDataPoint(event);
    } catch (error) {
      console.error("Error adding leaderboard data:", error);
    }
  }

  addAnalyticsData(event: AnalyticsEngineDataPoint) {
    try {
      this.env.ANALYTICS.writeDataPoint(event);
    } catch (error) {
      console.error("Error adding analytics data:", error);
    }
  }

  async getUserProfile(userId: string) {
    const [user] = await this.db
      .select({
        userId: userProfileTable.userId,
        firstName: userProfileTable.firstName,
        lastName: userProfileTable.lastName,
        city: userProfileTable.city,
        county: userProfileTable.county,
        countyCode: userProfileTable.countyCode,
      })
      .from(userProfileTable)
      .where(eq(userProfileTable.userId, userId));
    return user;
  }

  async getUserProfileBySecretKey(secretKey: string) {
    const [user] = await this.db
      .select()
      .from(userProfileTable)
      .where(eq(userProfileTable.secretKey, secretKey));
    return user;
  }

  async fetch() {
    return new Response(null, { status: 200 });
  }

  async testQuery(query: string) {
    return await testQuery(query, this.env);
  }

  async getUserLeaderboard(userId: string) {
    try {
      const [roundScoresResult, finalScoresResult] = await Promise.all([
        getUserLeaderboardData(this.env, userId),
        getUserFinalLeaderboardData(this.env, userId),
      ]);

      const roundScores = roundScoresResult.data.map((row) => ({
        influence: row.influence as number,
        empathy: row.empathy as number,
        harmony: row.harmony as number,
        totalScore: row.totalScore as number,
        agreeVotes: row.agreeVotes as number,
        neutralVotes: row.neutralVotes as number,
        disagreeVotes: row.disagreeVotes as number,
        // Add 1 to roundNumber since it's 0-indexed in the database but 1-indexed in the UI
        roundNumber: Number.parseInt(row.roundNumber as string, 10) + 1,
        debateTopic: (row.debateTopic as string) || "",
        debateQuestion: (row.debateQuestion as string) || "",
        answer: row.answer as string | null,
        roomId: row.roomId as string,
      }));

      // Group rounds by roomId to create games
      const gameMap = new Map<string, { roomId: string; rounds: typeof roundScores }>();

      for (const round of roundScores) {
        if (!gameMap.has(round.roomId)) {
          gameMap.set(round.roomId, { roomId: round.roomId, rounds: [] });
        }
        gameMap.get(round.roomId)?.rounds.push(round);
      }

      // Sort rounds within each game by roundNumber
      for (const game of gameMap.values()) {
        game.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
      }

      // Convert map to array and sort games by the first round's creation time (newest first)
      const games = Array.from(gameMap.values());

      let finalScores = null;
      if (finalScoresResult.data.length > 0) {
        const row = finalScoresResult.data[0];
        finalScores = {
          influence: row.influence as number,
          empathy: row.empathy as number,
          harmony: row.harmony as number,
          totalScore: row.totalScore as number,
          totalPlayers: row.totalPlayers as number,
          rank: Number.parseInt(row.rank as string, 10),
        };
      }

      return {
        games,
        roundScores, // Keep for backward compatibility
        finalScores,
      };
    } catch (error) {
      console.error("Error fetching user leaderboard:", error);
      throw error;
    }
  }

  async getGameDetails(roomId: string) {
    try {
      const [roundScoresResult, finalScoresResult] = await Promise.all([
        getGameRoundData(this.env, roomId),
        getGameFinalData(this.env, roomId),
      ]);

      // Process round data
      const roundsData = roundScoresResult.data.map((row) => ({
        influence: row.influence as number,
        empathy: row.empathy as number,
        harmony: row.harmony as number,
        totalScore: row.totalScore as number,
        agreeVotes: row.agreeVotes as number,
        neutralVotes: row.neutralVotes as number,
        disagreeVotes: row.disagreeVotes as number,
        // Add 1 to roundNumber since it's 0-indexed in the database but 1-indexed in the UI
        roundNumber: Number.parseInt(row.roundNumber as string, 10) + 1,
        debateTopic: (row.topicId as string) || "",
        debateQuestion: (row.question as string) || "",
        answer: row.answer as string | null,
        playerId: row.playerId as string,
        playerName: row.playerName as string,
        candidateId: row.candidateId as string,
        city: row.city as string,
        county: row.county as string,
        countyCode: row.countyCode as string,
      }));

      // Group by player
      const playerMap = new Map<
        string,
        {
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
        }
      >();

      // Process players and their rounds
      for (const round of roundsData) {
        if (!playerMap.has(round.playerId)) {
          playerMap.set(round.playerId, {
            playerId: round.playerId,
            playerName: round.playerName,
            candidateId: round.candidateId,
            city: round.city,
            county: round.county,
            countyCode: round.countyCode,
            rounds: [],
          });
        }

        playerMap.get(round.playerId)?.rounds.push({
          roundNumber: round.roundNumber,
          influence: round.influence,
          empathy: round.empathy,
          harmony: round.harmony,
          totalScore: round.totalScore,
          agreeVotes: round.agreeVotes,
          neutralVotes: round.neutralVotes,
          disagreeVotes: round.disagreeVotes,
          debateTopic: round.debateTopic,
          debateQuestion: round.debateQuestion,
          answer: round.answer,
        });
      }

      // Sort rounds within each player
      for (const player of playerMap.values()) {
        player.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
      }

      // Process final scores
      const finalScores = finalScoresResult.data.map((row) => ({
        playerId: row.playerId as string,
        playerName: row.playerName as string,
        candidateId: row.candidateId as string,
        influence: row.influence as number,
        empathy: row.empathy as number,
        harmony: row.harmony as number,
        totalScore: row.totalScore as number,
        rank: Number.parseInt(row.rank as string, 10),
        city: row.city as string,
        county: row.county as string,
        countyCode: row.countyCode as string,
      }));

      // Sort final scores by rank
      finalScores.sort((a, b) => a.rank - b.rank);

      // Get total rounds from the first player's rounds length
      const totalRounds =
        playerMap.size > 0
          ? Math.max(...Array.from(playerMap.values()).map((p) => p.rounds.length))
          : 0;

      return {
        roomId,
        players: Array.from(playerMap.values()),
        finalScores,
        totalRounds,
      };
    } catch (error) {
      console.error("Error fetching game details:", error);
      throw error;
    }
  }
}

export type GameBackendService = InstanceType<typeof GameBackend>;
