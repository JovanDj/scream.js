import { describe, expect, it } from "vitest";
import type { SqlExpression } from "../sql-expression.js";
import { HavingExpression } from "./having-expression.js";

describe("HavingExpression", () => {
	it("should form HAVING expression", () => {
		const condition = "COUNT(*) > 1";
		const havingExpression: SqlExpression = new HavingExpression(condition);

		expect(havingExpression.interpret()).toStrictEqual("HAVING COUNT(*) > 1");
	});
});
