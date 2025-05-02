import { createAPIFileRoute } from "@tanstack/react-start/api";
import { json } from "@tanstack/react-start";
import { omit } from "ramda";
import jwt from "@tsndr/cloudflare-worker-jwt";

import type { UserProfile } from "@joculdemocratiei/utils";

import { checkRateLimit } from "@/utils/lib";
import { env as appEnv } from "@/env";

export const APIRoute = createAPIFileRoute("/api/create-user")({
  POST: async ({ request }) => {
    const { env } = request.context.cloudflare;
    const user = await request.json<UserProfile>();

    const rateLimited = await checkRateLimit(request);

    if (rateLimited) {
      return rateLimited;
    }

    try {
      if (user.firstName !== "Anonim" && user.lastName !== "Anonim") {
        await env.GAME_BACKEND.createUser(user);
      }
    } catch (error) {
      console.error("error", error);
      return json({ error: "Failed to create user" }, { status: 500 });
    }

    const token = await jwt.sign(omit(["secretKey"], user), appEnv.JWT_SECRET);
    return json({ token, userId: user.userId });
  },
});
