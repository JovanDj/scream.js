import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { UpdateExpression } from "./update-expression.js";

describe("UpdateExpression", () => {
	it("should form UPDATE expression", () => {
		const table = "users";
		const values = { name: "Alice", age: 30 };
		const updateExpression: SqlExpression = new UpdateExpression(table, values);

		assert.deepStrictEqual(
			updateExpression.interpret(),
			"UPDATE users SET name='Alice', age='30'",
		);
	});
});
