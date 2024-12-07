import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Todo } from "./todo.js";

describe("Todo", () => {
	it("should serialize json", () => {
		const todo = new Todo(1, 1, "title");

		const serialized = todo.toJSON();

		assert.deepStrictEqual(serialized, {
			id: 1,
			userId: 1,
			title: "title",
		});
	});
});
