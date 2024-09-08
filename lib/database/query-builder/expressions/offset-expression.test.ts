import { describe, expect, it } from "vitest";
import type { SqlExpression } from "../sql-expression.js";
import { OffsetExpression } from "./offset-expression.js";

describe("OffsetExpression", () => {
	it("should form OFFSET expression", () => {
		const offset = 20;
		const offsetExpression: SqlExpression = new OffsetExpression(offset);

		expect(offsetExpression.interpret()).toStrictEqual("OFFSET 20");
	});
});
