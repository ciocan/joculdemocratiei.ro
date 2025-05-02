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

import { getUserLeaderboardData, getUserFinalLeaderboardData, testQuery } from "./lib/leaderboards";

export interface Env {
  DB: D1Database;
  LEADERBOARD: AnalyticsEngineDataset;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  ENVIRONMENT: "local" | "dev" | "production";
  DATA_BUCKET: R2Bucket;
}

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

  addLeaderboardData(event: AnalyticsEngineDataPoint) {
    try {
      this.env.LEADERBOARD.writeDataPoint(event);
    } catch (error) {
      console.error("Error adding leaderboard data:", error);
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

  async fetch() {
    return new Response(null, { status: 200 });
  }

  async getUserLeaderboardTest() {
    return {
      roundScores: Array.from({ length: 3 }, (_, i) => ({
        influence: Math.floor(Math.random() * 10000),
        empathy: Math.floor(Math.random() * 10000),
        harmony: Math.floor(Math.random() * 10000),
        totalScore: Math.floor(Math.random() * 30000),
        agreeVotes: Math.floor(Math.random() * 20),
        neutralVotes: Math.floor(Math.random() * 10),
        disagreeVotes: Math.floor(Math.random() * 5),
        roundNumber: i + 1,
        debateTopic: `Mock Topic ${i + 1}`,
        debateQuestion: `Mock Question for round ${i + 1}?`,
        answer: Math.random() > 0.5 ? `Mock Answer ${i + 1}` : null,
      })),
      cumulativeScores: Array.from({ length: 3 }, (_, i) => ({
        influence: Math.floor(Math.random() * 20000),
        empathy: Math.floor(Math.random() * 20000),
        harmony: Math.floor(Math.random() * 20000),
        totalScore: Math.floor(Math.random() * 60000),
        agreeVotes: Math.floor(Math.random() * 40),
        neutralVotes: Math.floor(Math.random() * 20),
        disagreeVotes: Math.floor(Math.random() * 10),
        roundNumber: i + 1,
        debateTopic: `Mock Topic ${i + 1}`,
        debateQuestion: `Mock Question for round ${i + 1}?`,
      })),
      finalScores: {
        influence: Math.floor(Math.random() * 30000),
        empathy: Math.floor(Math.random() * 30000),
        harmony: Math.floor(Math.random() * 30000),
        totalScore: Math.floor(Math.random() * 90000),
        totalPlayers: Math.floor(Math.random() * 50) + 10,
        rank: Math.floor(Math.random() * 10) + 1,
      },
    };
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
        roundNumber: Number.parseInt(row.roundNumber as string, 10),
        debateTopic: (row.debateTopic as string) || "",
        debateQuestion: (row.debateQuestion as string) || "",
        answer: row.answer as string | null,
      }));

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
        roundScores,
        finalScores,
      };
    } catch (error) {
      console.error("Error fetching user leaderboard:", error);
      throw error;
    }
  }
}

export type GameBackendService = InstanceType<typeof GameBackend>;
