import { createAPIFileRoute } from "@tanstack/react-start/api";
import { json } from "@tanstack/react-start";

import { checkRateLimit } from "@/utils/lib";

export const APIRoute = createAPIFileRoute("/api/get-user-leaderboard")({
  GET: async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { env } = request.context.cloudflare;

    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    const rateLimited = await checkRateLimit(request);

    if (rateLimited) {
      return rateLimited;
    }

    try {
      const leaderboardData = await env.GAME_BACKEND.getUserLeaderboard(userId);
      return json(leaderboardData);
    } catch (error) {
      console.error("Error fetching user leaderboard:", error);
      return json({ error: "Nu s-au putut încărca datele clasamentului" }, { status: 500 });
    }
  },
});
