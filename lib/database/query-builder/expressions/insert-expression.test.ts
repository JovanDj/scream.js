import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { InsertExpression } from "./insert-expression.js";

describe("InsertExpression", () => {
	it("should form INSERT INTO expression", (t: TestContext) => {
		t.plan(1);
		const table = "users";
		const values = { id: 1, name: "Alice" };
		const insertExpression: SqlExpression = new InsertExpression(table, values);

		t.assert.deepStrictEqual(
			insertExpression.interpret(),
			"INSERT INTO users (id, name) VALUES ('1', 'Alice')",
		);
	});
});
