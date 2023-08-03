import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    bail: 1,
    typecheck: {
      checker: "tsc",
      tsconfig: "./tsconfig.json",
    },
    reporters: ["verbose"],
    include: [
      "./server.test.ts",
      "./integration.test.ts",
      "./src/**/*.test.ts",
      "./lib/**/*.test.ts",
    ],
  },
});
