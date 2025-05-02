import { defineConfig } from "drizzle-kit";

const { DB_ID, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;

export default defineConfig({
  driver: "d1-http",
  dialect: "sqlite",
  schema: "./src/drizzle/schema.ts",
  out: "./src/drizzle/migrations",
  dbCredentials: {
    accountId: CLOUDFLARE_ACCOUNT_ID!,
    token: CLOUDFLARE_API_TOKEN!,
    databaseId: DB_ID!,
  },
});
