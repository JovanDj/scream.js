import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { OffsetExpression } from "./offset-expression.js";

describe("OffsetExpression", () => {
	it("should form OFFSET expression", () => {
		const offset = 20;
		const offsetExpression: SqlExpression = new OffsetExpression(offset);

		assert.deepStrictEqual(offsetExpression.interpret(), "OFFSET 20");
	});
});
