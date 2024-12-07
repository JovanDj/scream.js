import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { WhereExpression } from "./where-expression.js";

describe("WhereExpression", () => {
	it("should form WHERE expression", () => {
		const values = "name = test";
		const updateExpression: SqlExpression = new WhereExpression(values);

		assert.deepStrictEqual(updateExpression.interpret(), "WHERE name = test");
	});
});
