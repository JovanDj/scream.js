import { describe, expect, it } from "vitest";
import type { SqlExpression } from "../sql-expression.js";
import { WhereExpression } from "./where-expression.js";

describe("WhereExpression", () => {
	it("should form WHERE expression", () => {
		const values = "name = test";
		const updateExpression: SqlExpression = new WhereExpression(values);

		expect(updateExpression.interpret()).toStrictEqual("WHERE name = test");
	});
});
