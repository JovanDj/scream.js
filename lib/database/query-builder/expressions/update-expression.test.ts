import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { UpdateExpression } from "./update-expression.js";

describe("UpdateExpression", { concurrency: true }, () => {
	it("should form UPDATE expression", (t: TestContext) => {
		t.plan(1);
		const table = "users";
		const values = { age: 30, name: "Alice" };
		const updateExpression: SqlExpression = new UpdateExpression(table, values);

		t.assert.deepStrictEqual(
			updateExpression.interpret(),
			"UPDATE users SET age='30', name='Alice'",
		);
	});
});
