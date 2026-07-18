import { describe, it, type TestContext } from "node:test";
import { ExecutionResult } from "./execution-result.js";

describe("ExecutionResult", { concurrency: true }, () => {
	it("returns the inserted ID and affected row count", (t: TestContext) => {
		const result = new ExecutionResult(42, 3);

		t.assert.deepStrictEqual(result.insertedId(), 42);
		t.assert.deepStrictEqual(result.affectedRows(), 3);
	});

	it("returns no inserted ID for non-insert statements", (t: TestContext) => {
		const result = new ExecutionResult(undefined, 1);

		t.assert.deepStrictEqual(result.insertedId(), undefined);
		t.assert.deepStrictEqual(result.affectedRows(), 1);
	});
});
