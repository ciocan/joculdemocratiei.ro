import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

import {
  getMatchmakerStub,
  getGameRoomStub,
  buildWsUrl,
  authMiddleware,
  allowedOrigins,
  rateLimiterMiddleware,
} from "./lib/util";
import { Matchmaker } from "./lib/matchmaker";
import { DebateRoom } from "./lib/debate-room";
import { formatDateTime, logger, type UserProfile } from "@joculdemocratiei/utils";

type Variables = {
  user: UserProfile;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 600,
  }),
);

app.get("/", (c) => c.redirect("https://joculdemocratiei.ro"));

app.use("/api/*", authMiddleware);
app.use("/api/*", rateLimiterMiddleware);

app.post("/api/create", async (c) => {
  const { isPrivate } = await c.req.json<{ isPrivate: boolean }>();
  const user = c.get("user");
  const mm = getMatchmakerStub(c.env);
  const roomId = await mm.createRoom({ isPrivate, userId: user.userId });
  return c.json({ roomId });
});

app.post("/api/join-random", async (c) => {
  try {
    const mm = getMatchmakerStub(c.env);
    const roomId = await mm.joinRoom();
    return c.json({ roomId });
  } catch (error) {
    if (error instanceof Error && error.message === "No available rooms") {
      return c.json(
        {
          error:
            "Nu există camere disponibile în acest moment. Poți crea o cameră nouă sau încearcă din nou mai târziu.",
        },
        404,
      );
    }
    logger.error("Error joining room:", error);
    return c.json({ error: "Eroare la alăturarea la o cameră" }, 500);
  }
});

app.get("/api/ws-url/:roomId", async (c) => {
  const { roomId } = c.req.param();

  if (!roomId) {
    return c.text("roomId is required", 400);
  }

  const mm = getMatchmakerStub(c.env);
  const room = await mm.getRoom(roomId);

  if (!room) {
    return c.json({ error: "camera nu există" }, 404);
  }

  if (room.seats >= 6) {
    return c.json({ error: "camera este plină" }, { status: 404 });
  }

  if (room.isStarted) {
    return c.json({ error: "camera a început" }, { status: 404 });
  }

  const wsUrl = buildWsUrl(c.req.raw, roomId);
  return c.json({ wsUrl });
});

app.use("/ws/*", authMiddleware);
app.use("/ws/*", rateLimiterMiddleware);

app.all("/ws/:roomId", (c) => {
  const { roomId } = c.req.param();
  switch (roomId) {
    case "game": {
      const mm = getMatchmakerStub(c.env);
      return mm.fetch(c.req.raw);
    }
    default: {
      const gr = getGameRoomStub(c.env, roomId);
      return gr.fetch(c.req.raw);
    }
  }
});

app.get("/api/game-ws-url", (c) => {
  const wsUrl = buildWsUrl(c.req.raw, "game");
  return c.json({ wsUrl });
});

app.onError((err: Error | HTTPException, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return c.json({ error: "Internal server error" }, 500);
});

export { Matchmaker, DebateRoom };

async function scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
  logger.info(
    `Cron controller ${controller.cron} run at: ${formatDateTime(new Date().toISOString(), "UTC", "td")}`,
  );

  const mm = getMatchmakerStub(env);

  switch (controller.cron) {
    case "* * * * *":
      // local trigger with curl "http://localhost:4201/cdn-cgi/handler/scheduled?cron=*+*+*+*+*"
      await mm.removeStalledRooms();
      break;
    case "0/5 * * * *":
      await mm.removeStalledRooms();
      break;
    default:
      logger.info(`Cron triggered: ${controller.cron}`);
      break;
  }

  ctx.waitUntil(Promise.resolve());
}

export default {
  fetch: app.fetch,
  scheduled,
};
