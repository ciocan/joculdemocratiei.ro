import { type Options, defineConfig } from "tsup";

export default defineConfig((options: Options) => ({
  format: "esm",
  target: "esnext",
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  entry: ["src/**/*.ts"],
  outDir: "dist",
  ...options,
  onSuccess: "tsc --emitDeclarationOnly --declaration",
}));
