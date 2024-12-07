import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { DeleteExpression } from "./delete-expression.js";

describe("DeleteExpression", () => {
	it("should form DELETE FROM expression", () => {
		const table = "users";
		const deleteExpression: SqlExpression = new DeleteExpression(table);

		assert.deepStrictEqual(deleteExpression.interpret(), "DELETE FROM users");
	});
});
