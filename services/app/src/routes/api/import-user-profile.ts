import { createAPIFileRoute } from "@tanstack/react-start/api";
import { json } from "@tanstack/react-start";
import { omit } from "ramda";
import jwt from "@tsndr/cloudflare-worker-jwt";

import { checkRateLimit } from "@/utils/lib";
import { env as appEnv } from "@/env";

export const APIRoute = createAPIFileRoute("/api/import-user-profile")({
  POST: async ({ request }) => {
    const { env } = request.context.cloudflare;
    const { secretKey } = await request.json<{ secretKey: string }>();

    if (!secretKey) {
      return json({ error: "Secret key is required" }, { status: 400 });
    }

    const rateLimited = await checkRateLimit(request);

    if (rateLimited) {
      return rateLimited;
    }

    try {
      const userProfile = await env.GAME_BACKEND.getUserProfileBySecretKey(secretKey);

      if (!userProfile) {
        return json({ error: "Nu am putut găsi profilul utilizatorului" }, { status: 404 });
      }

      const token = await jwt.sign(omit(["secretKey"], userProfile), appEnv.JWT_SECRET);
      return json({ token, user: userProfile });
    } catch (error) {
      console.error("Error importing user profile:", error);
      return json({ error: "Nu am putut importa profilul utilizatorului" }, { status: 500 });
    }
  },
});
