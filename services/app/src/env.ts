import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    TURNSTILE_SECRET_KEY: z.string().min(1),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    CLOUDFLARE_API_TOKEN: z.string().min(1),
    JWT_SECRET: z.string().min(1),
  },
  clientPrefix: "VITE_",
  client: {
    VITE_TURNSTILE_SITE_KEY: z.string().min(1),
    VITE_API_URL: z.string().min(1),
  },
  runtimeEnv: {
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    JWT_SECRET: process.env.JWT_SECRET,
    VITE_TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY,
    VITE_API_URL: import.meta.env.VITE_API_URL,
  },
  emptyStringAsUndefined: true,
});
