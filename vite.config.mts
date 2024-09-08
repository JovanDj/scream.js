import tsconfigPaths from "vite-tsconfig-paths";
import { defaultExclude, defineConfig } from "vitest/config";

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
		exclude: [...defaultExclude, "e2e"],
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
