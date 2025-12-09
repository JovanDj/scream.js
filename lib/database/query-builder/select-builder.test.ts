import { describe, it, type TestContext } from "node:test";
import { SelectExpression } from "./expressions/select-expression.js";
import { SelectBuilder } from "./select-builder.js";

describe("SelectBuilder", { concurrency: true }, () => {
	it("should append FROM after existing expressions and preserve params", (t: TestContext) => {
		t.plan(1);
		const builder = new SelectBuilder(
			[new SelectExpression("name")],
			["tenant-42"],
		);

		const query = builder.from("users").build();

		t.assert.deepStrictEqual(query, {
			params: ["tenant-42"],
			sql: "SELECT name FROM users",
		});
	});
});
