import { describe, expect, it } from "vitest";
import { Todo } from "./todo.js";

describe("Todo", () => {
	it("should serialize json", () => {
		const todo = new Todo(1, 1, "title");

		const serialized = todo.toJSON();

		expect(serialized).toStrictEqual({
			id: 1,
			userId: 1,
			title: "title",
		});
	});
});
