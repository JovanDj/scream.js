import { afterEach, describe, it, type TestContext } from "node:test";
import { createDB } from "./db.js";

describe("createDB", { concurrency: false }, () => {
	const originalNodeEnv = process.env["NODE_ENV"];

	afterEach(() => {
		if (originalNodeEnv === undefined) {
			delete process.env["NODE_ENV"];
		} else {
			process.env["NODE_ENV"] = originalNodeEnv;
		}
	});

	it("uses NODE_ENV when no explicit environment is provided", async (t: TestContext) => {
		t.plan(1);
		process.env["NODE_ENV"] = "integration";
		const db = createDB();

		try {
			const row = await db.raw("select 1 as value");

			t.assert.deepStrictEqual(row[0].value, 1);
		} finally {
			await db.destroy();
		}
	});
});
