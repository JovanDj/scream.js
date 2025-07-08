import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { InsertResult } from "./insert-result.ts";

describe("InsertResult", { concurrency: true }, () => {
	it("should store and return lastId", () => {
		const result = new InsertResult(42);
		assert.deepStrictEqual<number>(result.lastId, 42);
	});
});
