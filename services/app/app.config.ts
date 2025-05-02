import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "unenv";
import cfProxy from "@ponjimon/vite-plugin-tss-cloudflare-proxy";

export default defineConfig({
  server: {
    preset: "cloudflare-module",
    unenv: cloudflare,
  },
  tsr: {
    appDirectory: "src",
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      cfProxy({}),
    ],
  },
});
