import { resolve } from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	root: resolve(__dirname, "resources"),

	build: {
		manifest: true,
		outDir: "public",
	},
	css: {
		preprocessorOptions: {
			scss: {
				silenceDeprecations: [
					"import",
					"mixed-decls",
					"color-functions",
					"global-builtin",
					"legacy-js-api",
				],
			},
		},
	},
	plugins: [tsconfigPaths()],
	appType: "mpa",
	test: {
		bail: 1,
		sequence: { shuffle: true, concurrent: true },
		typecheck: {
			checker: "tsc",
			tsconfig: "tsconfig.json",
		},
		reporters: ["verbose"],
	},
});
