import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  appType: "mpa",
  test: {
    environment: "node",
    bail: 1,
    sequence: { shuffle: true, concurrent: true },
    typecheck: {
      checker: "tsc",
      tsconfig: "./tsconfig.json",
    },
    coverage: {
      exclude: ["lib/http/koa"],
    },
    reporters: ["verbose"],
  },
});
