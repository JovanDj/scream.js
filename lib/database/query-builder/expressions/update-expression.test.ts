import { describe, expect, it } from "vitest";
import type { SqlExpression } from "../sql-expression.js";
import { UpdateExpression } from "./update-expression.js";

describe("UpdateExpression", () => {
	it("should form UPDATE expression", () => {
		const table = "users";
		const values = { name: "Alice", age: 30 };
		const updateExpression: SqlExpression = new UpdateExpression(table, values);

		expect(updateExpression.interpret()).toStrictEqual(
			"UPDATE users SET name='Alice', age='30'",
		);
	});
});
