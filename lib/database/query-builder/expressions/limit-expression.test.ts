import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { LimitExpression } from "./limit-expression.js";

describe("LimitExpression", () => {
	it("should form LIMIT expression", (t: TestContext) => {
		t.plan(1);
		const limit = 10;
		const limitExpression: SqlExpression = new LimitExpression(limit);

		t.assert.deepStrictEqual(limitExpression.interpret(), "LIMIT 10");
	});
});
