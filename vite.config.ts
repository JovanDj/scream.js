import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    // generate .vite/manifest.json in outDir
    manifest: true,
    outDir: "public",

    rollupOptions: {
      // overwrite default .html entry
      input: "resources/main.js",
    },
  },

  plugins: [tsconfigPaths()],
  appType: "mpa",
  test: {
    exclude: [
      "tests",
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
    ],
    environment: "node",
    bail: 1,
    sequence: { shuffle: true, concurrent: true },
    typecheck: {
      checker: "tsc",
      tsconfig: "tsconfig.json",
    },
    coverage: {
      exclude: ["lib/http/koa"],
    },
    reporters: ["verbose"],
  },
});
