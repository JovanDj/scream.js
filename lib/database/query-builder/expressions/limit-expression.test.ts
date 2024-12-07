import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { LimitExpression } from "./limit-expression.js";

describe("LimitExpression", () => {
	it("should form LIMIT expression", () => {
		const limit = 10;
		const limitExpression: SqlExpression = new LimitExpression(limit);

		assert.deepStrictEqual(limitExpression.interpret(), "LIMIT 10");
	});
});
