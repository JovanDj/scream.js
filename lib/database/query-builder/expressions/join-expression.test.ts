import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { JoinExpression } from "./join-expression.js";

describe("JoinExpression", { concurrency: true }, () => {
	it("should form INNER JOIN expression", (t: TestContext) => {
		t.plan(1);
		const table = "orders";
		const condition = "users.id = orders.user_id";
		const joinExpression: SqlExpression = new JoinExpression(table, condition);

		t.assert.deepStrictEqual(
			joinExpression.interpret(),
			"INNER JOIN orders ON users.id = orders.user_id",
		);
	});

	it("should form LEFT JOIN expression", (t: TestContext) => {
		t.plan(1);
		const table = "orders";
		const condition = "users.id = orders.user_id";
		const joinExpression: SqlExpression = new JoinExpression(
			table,
			condition,
			"LEFT",
		);

		t.assert.deepStrictEqual(
			joinExpression.interpret(),
			"LEFT JOIN orders ON users.id = orders.user_id",
		);
	});
});
