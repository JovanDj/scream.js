import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { OffsetExpression } from "./offset-expression.js";

describe("OffsetExpression", () => {
	it("should form OFFSET expression", (t: TestContext) => {
		t.plan(1);
		const offset = 20;
		const offsetExpression: SqlExpression = new OffsetExpression(offset);

		t.assert.deepStrictEqual(offsetExpression.interpret(), "OFFSET 20");
	});
});
