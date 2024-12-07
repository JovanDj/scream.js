import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { FromExpression } from "./from-expression.js";

describe("FromExpression", () => {
	it("should form FROM expression", () => {
		const table = "users";
		const fromExpression: SqlExpression = new FromExpression(table);

		assert.deepStrictEqual(fromExpression.interpret(), "FROM users");
	});
});
