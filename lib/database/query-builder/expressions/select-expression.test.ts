import { describe, expect, it } from "vitest";
import type { SqlExpression } from "../sql-expression.js";
import { SelectExpression } from "./select-expression.js";

describe("SelectExpression", () => {
	it("should form SELECT expression with a single field", () => {
		const fields = "name";
		const selectExpression: SqlExpression = new SelectExpression(fields);

		expect(selectExpression.interpret()).toStrictEqual("SELECT name");
	});

	it("should form SELECT * expression with no fields provided", () => {
		const selectExpression: SqlExpression = new SelectExpression();

		expect(selectExpression.interpret()).toStrictEqual("SELECT *");
	});
});
