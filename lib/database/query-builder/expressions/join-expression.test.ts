import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { JoinExpression } from "./join-expression.js";

describe("JoinExpression", () => {
	it("should form INNER JOIN expression", () => {
		const table = "orders";
		const condition = "users.id = orders.user_id";
		const joinExpression: SqlExpression = new JoinExpression(table, condition);

		assert.deepStrictEqual(
			joinExpression.interpret(),
			"INNER JOIN orders ON users.id = orders.user_id",
		);
	});

	it("should form LEFT JOIN expression", () => {
		const table = "orders";
		const condition = "users.id = orders.user_id";
		const joinExpression: SqlExpression = new JoinExpression(
			table,
			condition,
			"LEFT",
		);

		assert.deepStrictEqual(
			joinExpression.interpret(),
			"LEFT JOIN orders ON users.id = orders.user_id",
		);
	});
});
