import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { OrderByExpression } from "./order-by-expression.js";

describe("OrderByExpression", { concurrency: true }, () => {
	it("should form ASC expression", (t: TestContext) => {
		t.plan(1);
		const field = "name";
		const directon: ConstructorParameters<typeof OrderByExpression>[1] = "ASC";

		const fromExpression: SqlExpression = new OrderByExpression(
			field,
			directon,
		);

		t.assert.deepStrictEqual(fromExpression.interpret(), "ORDER BY name ASC");
	});

	it("should form DESC expression", (t: TestContext) => {
		t.plan(1);
		const field = "name";
		const directon: ConstructorParameters<typeof OrderByExpression>[1] = "DESC";

		const fromExpression: SqlExpression = new OrderByExpression(
			field,
			directon,
		);

		t.assert.deepStrictEqual(fromExpression.interpret(), "ORDER BY name DESC");
	});

	it("should form ASC expression by default", (t: TestContext) => {
		t.plan(1);
		const field = "name";
		const fromExpression: SqlExpression = new OrderByExpression(field);

		t.assert.deepStrictEqual(fromExpression.interpret(), "ORDER BY name ASC");
	});
});
