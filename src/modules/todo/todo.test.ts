import { describe, it, type TestContext } from "node:test";
import { Todo, type TodoSnapshot } from "./todo.js";

describe("Todo domain", { concurrency: true }, () => {
	const createTodo = (overrides: Partial<TodoSnapshot> = {}) =>
		new Todo({
			completedAt: null,
			createdAt: "2026-01-01T00:00:00.000Z",
			description: "Original description",
			dueAt: "2026-01-10T00:00:00.000Z",
			id: 7,
			priority: "medium",
			projectId: 3,
			statusCode: "open",
			title: "Original title",
			updatedAt: "2026-01-01T00:00:00.000Z",
			...overrides,
		});

	it("apply updates writable fields and preserves identity fields", (t: TestContext) => {
		const todo = createTodo();

		const updated = todo.apply({
			description: "Updated description",
			dueAt: "2026-01-12T00:00:00.000Z",
			priority: "high",
			projectId: 9,
			statusCode: "completed",
			title: "Updated title",
		});

		t.assert.deepStrictEqual(updated.id, todo.id);
		t.assert.deepStrictEqual(updated.createdAt, todo.createdAt);
		t.assert.deepStrictEqual(updated.title, "Updated title");
		t.assert.deepStrictEqual(updated.description, "Updated description");
		t.assert.deepStrictEqual(updated.priority, "high");
		t.assert.deepStrictEqual(updated.projectId, 9);
		t.assert.deepStrictEqual(updated.statusCode, "completed");
		t.assert.deepStrictEqual(updated.completedAt === null, false);
		t.assert.deepStrictEqual(updated.updatedAt === todo.updatedAt, false);
	});

	it("toggle completes an open todo and clears completedAt when reopened", (t: TestContext) => {
		const openTodo = createTodo();
		const completedTodo = openTodo.toggle();
		const reopenedTodo = completedTodo.toggle();

		t.assert.deepStrictEqual(completedTodo.statusCode, "completed");
		t.assert.deepStrictEqual(completedTodo.completedAt === null, false);
		t.assert.deepStrictEqual(reopenedTodo.statusCode, "open");
		t.assert.deepStrictEqual(reopenedTodo.completedAt, null);
	});
});
