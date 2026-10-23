import { resolve } from "node:path";
import { it, type TestContext } from "node:test";
import { createServer, resolveConfig } from "vite";

it("does not silently change the asset server port", async (t: TestContext) => {
	const config = await resolveConfig({}, "serve");

	t.assert.deepStrictEqual(config.server.strictPort, true);
});

it("serves Bootstrap and application CSS without a Sass compiler", async (t: TestContext) => {
	const server = await createServer({
		server: { middlewareMode: true, watch: null },
	});
	t.after(() => server.close());

	const stylesheet = await server.transformRequest("/styles.css?direct");

	t.assert.ok(stylesheet?.code.includes(".btn"));
	t.assert.ok(stylesheet?.code.includes(".app-shell"));
});

it("resolves module and framework aliases", async (t: TestContext) => {
	const server = await createServer({
		server: { middlewareMode: true, watch: null },
	});
	t.after(() => server.close());
	const client = server.environments["client"];
	t.assert.ok(client);
	const importer = resolve("resources/main.ts");

	const module = await client.pluginContainer.resolveId(
		"@/modules/todo",
		importer,
	);
	const framework = await client.pluginContainer.resolveId(
		"@scream.js/http/application.ts",
		importer,
	);

	t.assert.strictEqual(module?.id, resolve("src/modules/todo/index.ts"));
	t.assert.strictEqual(framework?.id, resolve("lib/http/application.ts"));
});
