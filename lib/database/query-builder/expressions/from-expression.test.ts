import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { FromExpression } from "./from-expression.js";

describe("FromExpression", () => {
	it("should form FROM expression", (t: TestContext) => {
		t.plan(1);
		const table = "users";
		const fromExpression: SqlExpression = new FromExpression(table);

		t.assert.deepStrictEqual(fromExpression.interpret(), "FROM users");
	});
});
