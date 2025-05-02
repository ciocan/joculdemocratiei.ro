import { defineConfig } from "drizzle-kit";

const { LOCAL_DB_PATH } = process.env;

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/drizzle/schema.ts",
  out: "./src/drizzle/migrations",
  dbCredentials: {
    url: LOCAL_DB_PATH!,
  },
});
