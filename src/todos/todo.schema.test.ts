import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTodoSchema } from "./todo.schema.ts";

describe("createTodoSchema", () => {
	it("rejects missing title", () => {
		const data = { userId: 1 };

		assert.throws(() => createTodoSchema.parse(data));
	});
});
