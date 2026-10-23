import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	appType: "mpa",

	build: {
		manifest: true,
		outDir: "public",
	},
	resolve: {
		alias: [
			{
				find: /^@\/modules\/(.+)$/,
				replacement: resolve(__dirname, "src/modules/$1/index.ts"),
			},
			{ find: /^@\/(.+)$/, replacement: resolve(__dirname, "src/$1") },
			{
				find: /^@scream\.js\/(.+)$/,
				replacement: resolve(__dirname, "lib/$1"),
			},
		],
	},
	root: resolve(__dirname, "resources"),
	server: {
		strictPort: true,
	},
});
