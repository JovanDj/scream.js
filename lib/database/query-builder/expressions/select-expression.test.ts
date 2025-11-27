import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { SelectExpression } from "./select-expression.js";

describe("SelectExpression", () => {
	it("should form SELECT expression with a single field", (t: TestContext) => {
		t.plan(1);
		const fields = "name";
		const selectExpression: SqlExpression = new SelectExpression(fields);

		t.assert.deepStrictEqual(selectExpression.interpret(), "SELECT name");
	});

	it("should form SELECT * expression with no fields provided", (t: TestContext) => {
		t.plan(1);
		const selectExpression: SqlExpression = new SelectExpression();

		t.assert.deepStrictEqual(selectExpression.interpret(), "SELECT *");
	});
});
