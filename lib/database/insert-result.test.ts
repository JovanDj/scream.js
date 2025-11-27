import { describe, it, type TestContext } from "node:test";

import { InsertResult } from "./insert-result.js";

describe("InsertResult", { concurrency: true }, () => {
	it("should store and return lastId", (t: TestContext) => {
		t.plan(1);
		const result = new InsertResult(42);
		t.assert.deepStrictEqual<number>(result.lastId, 42);
	});
});
