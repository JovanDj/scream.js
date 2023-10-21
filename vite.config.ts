import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    bail: 1,
    sequence: { shuffle: true },
    typecheck: {
      checker: "tsc",
      tsconfig: "./tsconfig.json",
    },
    reporters: ["verbose"],
  },
});
