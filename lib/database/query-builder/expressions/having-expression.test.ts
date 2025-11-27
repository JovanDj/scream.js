import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { HavingExpression } from "./having-expression.js";

describe("HavingExpression", () => {
	it("should form HAVING expression", (t: TestContext) => {
		t.plan(1);
		const havingExpression: SqlExpression = new HavingExpression(
			"COUNT(*)",
			">",
		);

		t.assert.deepStrictEqual(
			havingExpression.interpret(),
			"HAVING COUNT(*) > ?",
		);
	});
});
