import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { GroupByExpression } from "./group-by-expression.js";

describe("GroupByExpression", { concurrency: true }, () => {
	it("should form GROUP BY expression", (t: TestContext) => {
		t.plan(1);
		const fields = "age";
		const groupByExpression: SqlExpression = new GroupByExpression(fields);

		t.assert.deepStrictEqual(groupByExpression.interpret(), "GROUP BY age");
	});
});
