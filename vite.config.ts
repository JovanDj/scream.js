import { defineConfig } from "vitest/config";

export default defineConfig({
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
