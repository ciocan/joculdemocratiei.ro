import { DurableObject } from "cloudflare:workers";
import { HTTPException } from "hono/http-exception";

import { logger, type UserProfile } from "@joculdemocratiei/utils";
import type GameBackendService from "../../../game-backend/src/index";
import type { DebateRoom } from "./debate-room";

import { validateToken } from "./util";

interface Env {
  GAME_BACKEND: Service<GameBackendService>;
  ENVIRONMENT: "dev" | "production" | "local";
  JWT_SECRET: string;
  MATCHMAKER: DurableObjectNamespace<Matchmaker>;
  DEBATE_ROOMS: DurableObjectNamespace<DebateRoom>;
}

type GameMessage = {
  type: "connected" | "disconnected";
};

type GameStats = {
  onlinePlayersCount: number;
  activeRoomsCount: number;
};

export class Matchmaker extends DurableObject<Env> {
  connections: Map<WebSocket, UserProfile>;
  storage: DurableObjectStorage;
  protected ctx: DurableObjectState;

  private readonly ONLINE_PLAYERS_COUNT_KEY = "online_players_count";
  private readonly ACTIVE_ROOMS_COUNT_KEY = "active_rooms_count";

  private onlinePlayersCount = 0;
  private activeRoomsCount = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx = ctx;
    this.storage = ctx.storage;
    this.connections = new Map();

    const websockets = this.ctx.getWebSockets();

    for (const ws of websockets) {
      const user = ws.deserializeAttachment();
      this.connections.set(ws, user);
    }

    this.ctx.blockConcurrencyWhile(async () => {
      await this.loadState();
    });
  }

  private async loadState() {
    this.onlinePlayersCount = (await this.storage.get(this.ONLINE_PLAYERS_COUNT_KEY)) || 0;
    this.activeRoomsCount = (await this.storage.get(this.ACTIVE_ROOMS_COUNT_KEY)) || 0;
  }

  private async saveState() {
    await this.storage.put(this.ONLINE_PLAYERS_COUNT_KEY, this.onlinePlayersCount);
    await this.storage.put(this.ACTIVE_ROOMS_COUNT_KEY, this.activeRoomsCount);
  }

  private getStats() {
    return {
      onlinePlayersCount: this.onlinePlayersCount,
      activeRoomsCount: this.activeRoomsCount,
    };
  }

  private async setStats(stats: GameStats) {
    this.onlinePlayersCount = stats.onlinePlayersCount;
    this.activeRoomsCount = stats.activeRoomsCount;
    this.broadcastGameStats();
    await this.saveState();
  }

  async updateConnectionCount() {
    const stats = this.getStats();
    await this.setStats({
      ...stats,
      onlinePlayersCount: this.connections.size,
    });
  }

  async updateAvailableRoomsCount() {
    const stats = this.getStats();
    await this.setStats({
      ...stats,
      activeRoomsCount: await this.env.GAME_BACKEND.getActiveRoomsCount(),
    });
  }

  async createRoom({
    isPrivate = false,
    userId,
  }: {
    isPrivate?: boolean;
    userId: string;
  }) {
    if (!userId) {
      throw new HTTPException(400, { message: "User ID is required" });
    }

    const room = {
      userId,
      seats: 0,
      isStarted: false,
      isPrivate,
      createdAt: new Date(),
    };

    const created = await this.env.GAME_BACKEND.createRoom(room);
    const roomId = created?.id;

    if (!roomId) {
      throw new Error("Failed to create room");
    }

    await this.updateAvailableRoomsCount();
    return roomId;
  }

  async joinRoom() {
    const roomId = await this.env.GAME_BACKEND.joinRoom();

    if (!roomId) {
      throw new Error("No available rooms");
    }

    return roomId;
  }

  async getRoom(roomId: string) {
    const room = await this.env.GAME_BACKEND.getRoom(roomId);
    return room;
  }

  broadcastGameStats() {
    const stats = this.getStats();
    const message = JSON.stringify({ type: "GAME_STATS", stats });

    for (const [ws, _] of this.connections.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          logger.error("[Matchmaker:broadcastGameStats] Error sending message:", error);
        }
      }
    }
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    const user = this.connections.get(ws);

    if (!user) {
      logger.error("[Matchmaker:webSocketMessage] User not found");
      return;
    }

    const parsedMessage = JSON.parse(message) as GameMessage;

    switch (parsedMessage.type) {
      case "connected": {
        await this.updateConnectionCount();
        break;
      }
      default: {
        logger.error("[Matchmaker:webSocketMessage] Unknown message type", parsedMessage);
        break;
      }
    }
  }

  async webSocketClose(ws: WebSocket) {
    this.connections.delete(ws);
    await this.updateConnectionCount();
    ws.close();
  }

  async webSocketError(_: WebSocket, error: Error) {
    logger.error("[Matchmaker:webSocketError] error", error);
    await this.updateConnectionCount();
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("No token", { status: 400 });
    }

    try {
      const user = await validateToken(token, this.env);

      if (!user) {
        return new Response("Unauthorized", { status: 401 });
      }

      const websocketPair = new WebSocketPair();
      const [client, server] = Object.values(websocketPair);

      this.ctx.acceptWebSocket(server);
      this.connections.set(server, user);
      this.broadcastGameStats();

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    } catch (error) {
      logger.error("[Matchmaker:fetch] WebSocket setup error:", error);
      return new Response("WebSocket setup failed", { status: 500 });
    }
  }
}
