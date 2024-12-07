import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { InsertExpression } from "./insert-expression.js";

describe("InsertExpression", () => {
	it("should form INSERT INTO expression", () => {
		const table = "users";
		const values = { id: 1, name: "Alice" };
		const insertExpression: SqlExpression = new InsertExpression(table, values);

		assert.deepStrictEqual(
			insertExpression.interpret(),
			"INSERT INTO users (id, name) VALUES ('1', 'Alice')",
		);
	});
});
