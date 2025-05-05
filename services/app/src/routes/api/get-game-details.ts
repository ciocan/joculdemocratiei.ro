import { createAPIFileRoute } from "@tanstack/react-start/api";
import { json } from "@tanstack/react-start";

import { checkRateLimit } from "@/utils/lib";

export const APIRoute = createAPIFileRoute("/api/get-game-details")({
  GET: async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const { env } = request.context.cloudflare;

    if (!roomId) {
      return json({ error: "Room ID is required" }, { status: 400 });
    }

    const rateLimited = await checkRateLimit(request);

    if (rateLimited) {
      return rateLimited;
    }

    try {
      const gameDetails = await env.GAME_BACKEND.getGameDetails(roomId);
      return json(gameDetails);
    } catch (error) {
      console.error("Error fetching game details:", error);
      return json({ error: "Nu s-au putut încărca detaliile jocului" }, { status: 500 });
    }
  },
});
