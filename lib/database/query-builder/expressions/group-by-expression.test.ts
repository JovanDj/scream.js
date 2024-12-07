import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { GroupByExpression } from "./group-by-expression.js";

describe("GroupByExpression", () => {
	it("should form GROUP BY expression", () => {
		const fields = "age";
		const groupByExpression: SqlExpression = new GroupByExpression(fields);

		assert.deepStrictEqual(groupByExpression.interpret(), "GROUP BY age");
	});
});
