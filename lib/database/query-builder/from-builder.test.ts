import { describe, it, type TestContext } from "node:test";
import { FromExpression } from "./expressions/from-expression.js";
import { SelectExpression } from "./expressions/select-expression.js";
import { WhereExpression } from "./expressions/where-expression.js";
import { FromBuilder } from "./from-builder.js";

describe("FromBuilder", { concurrency: true }, () => {
	it("should chain WHERE clauses with AND and keep param order", (t: TestContext) => {
		t.plan(1);
		const builder = new FromBuilder([
			new SelectExpression("*"),
			new FromExpression("users"),
		]);

		const query = builder
			.where("age", ">", 30)
			.where("active", "=", true)
			.build();

		t.assert.deepStrictEqual(query, {
			params: [30, true],
			sql: "SELECT * FROM users WHERE age > ? AND active = ?",
		});
	});

	it("should insert JOINs before existing WHERE clauses", (t: TestContext) => {
		t.plan(1);
		const builder = new FromBuilder(
			[
				new SelectExpression("*"),
				new FromExpression("users"),
				new WhereExpression("id", "="),
			],
			["123"],
		);

		const query = builder
			.join("orders", "users.id = orders.user_id", "INNER")
			.build();

		t.assert.deepStrictEqual(query, {
			params: ["123"],
			sql: "SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id WHERE id = ?",
		});
	});
});
