import { resolve } from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	appType: "mpa",

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
	root: resolve(__dirname, "resources"),
	test: {
		bail: 1,
		reporters: ["verbose"],
		sequence: { concurrent: true, shuffle: true },
		typecheck: {
			checker: "tsc",
			tsconfig: "tsconfig.json",
		},
	},
});
