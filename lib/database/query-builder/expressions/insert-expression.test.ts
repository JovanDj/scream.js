import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { InsertExpression } from "./insert-expression.js";

describe("InsertExpression", { concurrency: true }, () => {
	it("should form INSERT INTO expression", (t: TestContext) => {
		t.plan(1);
		const table = "users";
		const insertExpression: SqlExpression = new InsertExpression(table, [
			"id",
			"name",
		]);

		t.assert.deepStrictEqual(
			insertExpression.interpret(),
			"INSERT INTO users (id, name) VALUES (?, ?)",
		);
	});
});
