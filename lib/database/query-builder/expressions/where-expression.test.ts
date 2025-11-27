import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { WhereExpression } from "./where-expression.js";

describe("WhereExpression", { concurrency: true }, () => {
	it("should form WHERE expression", (t: TestContext) => {
		t.plan(1);
		const whereExpression: SqlExpression = new WhereExpression("name", "=");

		t.assert.deepStrictEqual(whereExpression.interpret(), "WHERE name = ?");
	});
});
