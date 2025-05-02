import type { Context, Next } from "hono";
import jwt from "@tsndr/cloudflare-worker-jwt";

import type { UserProfile } from "@joculdemocratiei/utils";
import { logger } from "@joculdemocratiei/utils";

export const allowedOrigins = [
  "localhost:4200",
  "joculdemocratiei.ro",
  "dev.joculdemocratiei.ro",
  "http://localhost:4200",
  "https://joculdemocratiei.ro",
  "https://dev.joculdemocratiei.ro",
];

export function checkOrigin(origin: string) {
  return allowedOrigins.map((o) => origin.endsWith(o)).some(Boolean) ? origin : false;
}

export function getMatchmakerStub(env: Env) {
  const id = env.MATCHMAKER.idFromName("matchmaker");
  const stub = env.MATCHMAKER.get(id);
  return stub;
}

export function getGameRoomStub(env: Env, roomId: string) {
  const id = env.DEBATE_ROOMS.idFromName(roomId);
  const stub = env.DEBATE_ROOMS.get(id);
  return stub;
}

export async function stubMiddleware(c: Context, next: Next) {
  const stub = getMatchmakerStub(c.env);
  c.set("gameServer", stub);
  return next();
}

export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header("Authorization")?.split(" ")[1] || c.req.query("token");

  if (!token) {
    return c.text("Unauthorized", 401);
  }

  const user = await validateToken(token, c.env);

  if (!user) {
    return c.text("Unauthorized", 401);
  }

  c.set("user", user);
  return next();
}

export async function rateLimiterMiddleware(c: Context, next: Next) {
  try {
    const user = c.get("user");
    const ip = c.req.header("X-Forwarded-For") || c.req.header("CF-Connecting-IP");
    const key = `${user.userId}-${ip}`;
    const { success } = await c.env.RATE_LIMITER.limit({ key });

    if (!success) {
      return c.text("Rate limit exceeded", 429);
    }

    return next();
  } catch (error) {
    logger.error("[RateLimiter:rateLimiterMiddleware] Error", error);
    return c.text("Internal server error", 500);
  }
}

export function buildWsUrl(req: Request, roomId: string) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  const host = req.headers.get("Host");
  const isLocalhost = host?.includes("localhost");
  return `${isLocalhost ? "ws" : "wss"}://${host}/ws/${roomId}?token=${token}`;
}

export async function validateToken(token: string, env: Env): Promise<UserProfile | null> {
  try {
    const isValid = await jwt.verify(token, env.JWT_SECRET);

    if (!isValid) {
      return null;
    }

    const decoded = jwt.decode(token);
    return decoded.payload as UserProfile;
  } catch (error) {
    logger.error("[Matchmaker:validateToken] Error validating token:", error);
    return null;
  }
}
