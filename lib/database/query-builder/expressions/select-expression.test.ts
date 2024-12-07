import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { SelectExpression } from "./select-expression.js";

describe("SelectExpression", () => {
	it("should form SELECT expression with a single field", () => {
		const fields = "name";
		const selectExpression: SqlExpression = new SelectExpression(fields);

		assert.deepStrictEqual(selectExpression.interpret(), "SELECT name");
	});

	it("should form SELECT * expression with no fields provided", () => {
		const selectExpression: SqlExpression = new SelectExpression();

		assert.deepStrictEqual(selectExpression.interpret(), "SELECT *");
	});
});
