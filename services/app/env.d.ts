/// <reference types="@cloudflare/workers-types" />

import type { H3EventContext } from "vinxi/http";
import type { PlatformProxy } from "wrangler";

import type { GameBackendService } from "../game-backend/src/index";

export interface EnvVars {
  GAME_BACKEND: Service<GameBackendService>;
  ENVIRONMENT: "local" | "dev" | "production";
  VITE_API_URL: string;
  RATE_LIMITER: RateLimit;
}

declare global {
  interface Env extends EnvVars {}
}

declare module "vinxi/http" {
  interface H3EventContext {
    cf: CfProperties;
    cloudflare: Omit<PlatformProxy<EnvVars>, "dispose">;
  }
}

declare global {
  interface Request {
    context: H3EventContext;
  }
}
