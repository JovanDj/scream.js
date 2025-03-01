import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { HavingExpression } from "./having-expression.js";

describe("HavingExpression", () => {
	it("should form HAVING expression", () => {
		const havingExpression: SqlExpression = new HavingExpression(
			"COUNT(*)",
			">",
		);

		assert.deepStrictEqual(havingExpression.interpret(), "HAVING COUNT(*) > ?");
	});
});
