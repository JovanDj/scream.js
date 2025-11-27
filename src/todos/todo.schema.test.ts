import { describe, it, type TestContext } from "node:test";
import { createTodoSchema } from "./todo.schema.js";

describe("createTodoSchema", () => {
	it("rejects missing title", (t: TestContext) => {
		t.plan(1);
		const data = { userId: 1 };

		t.assert.throws(() => createTodoSchema.parse(data));
	});
});
