import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { OrderByExpression } from "./order-by-expression.js";

describe("OrderByExpression", () => {
	it("should form ASC expression", () => {
		const field = "name";
		const directon: ConstructorParameters<typeof OrderByExpression>[1] = "ASC";

		const fromExpression: SqlExpression = new OrderByExpression(
			field,
			directon,
		);

		assert.deepStrictEqual(fromExpression.interpret(), "ORDER BY name ASC");
	});

	it("should form DESC expression", () => {
		const field = "name";
		const directon: ConstructorParameters<typeof OrderByExpression>[1] = "DESC";

		const fromExpression: SqlExpression = new OrderByExpression(
			field,
			directon,
		);

		assert.deepStrictEqual(fromExpression.interpret(), "ORDER BY name DESC");
	});

	it("should form ASC expression by default", () => {
		const field = "name";
		const fromExpression: SqlExpression = new OrderByExpression(field);

		assert.deepStrictEqual(fromExpression.interpret(), "ORDER BY name ASC");
	});
});
