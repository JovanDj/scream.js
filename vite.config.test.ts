import { it, type TestContext } from "node:test";
import { resolveConfig } from "vite";

it("does not silently change the asset server port", async (t: TestContext) => {
	const config = await resolveConfig({}, "serve");

	t.assert.deepStrictEqual(config.server.strictPort, true);
});
