import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

import { checkRateLimit } from "@/utils/lib";

export const APIRoute = createAPIFileRoute("/api/get-user-profile")({
  GET: async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { env } = request.context.cloudflare;

    if (!userId) {
      return json({ error: "User ID este necesar" }, { status: 400 });
    }

    try {
      const rateLimited = await checkRateLimit(request);

      if (rateLimited) {
        return rateLimited;
      }

      const userProfile = await env.GAME_BACKEND.getUserProfile(userId);

      if (!userProfile) {
        return json({ error: "Nu am putut găsi profilul utilizatorului" }, { status: 404 });
      }

      return json(userProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return json({ error: "Nu am putut găsi profilul utilizatorului" }, { status: 500 });
    }
  },
});
