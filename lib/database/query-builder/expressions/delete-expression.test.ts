import { describe, it, type TestContext } from "node:test";
import type { SqlExpression } from "../sql-expression.js";
import { DeleteExpression } from "./delete-expression.js";

describe("DeleteExpression", { concurrency: true }, () => {
	it("should form DELETE FROM expression", (t: TestContext) => {
		t.plan(1);
		const table = "users";
		const deleteExpression: SqlExpression = new DeleteExpression(table);

		t.assert.deepStrictEqual(deleteExpression.interpret(), "DELETE FROM users");
	});
});
