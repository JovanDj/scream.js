import { describe, it, type TestContext } from "node:test";
import { testDatabase } from "@scream.js/database/test-helpers.js";
import { createLogger } from "@scream.js/logger/logger-factory.js";
import { createTodoModule } from "./index.ts";
import type { TodoSchema } from "./todo.schema.js";

const setupTodoService = async () => {
	const { cleanup, db } = await testDatabase.setup({
		prepare: async (database) => {
			await database("users").insert({ username: "test user" });
		},
	});
	const logger = createLogger();

	const { todoService } = createTodoModule(db, logger);

	return { cleanup, todoService };
};

describe("TodoService", { concurrency: true }, () => {
	it("fetches todos", async (t: TestContext) => {
		t.plan(1);
		const { todoService, cleanup } = await setupTodoService();
		try {
			const todos = await todoService.findAll();

			t.assert.deepStrictEqual<TodoSchema[]>(todos, []);
		} finally {
			await cleanup();
		}
	});

	it("inserts a todo", async (t: TestContext) => {
		t.plan(3);
		const { todoService, cleanup } = await setupTodoService();

		try {
			const todo = await todoService.create({ title: "Test Todo", userId: 1 });
			t.assert.ok(todo.id);
			t.assert.deepStrictEqual<TodoSchema["title"]>(todo.title, "Test Todo");
			t.assert.deepStrictEqual<TodoSchema["userId"]>(todo.userId, 1);
		} finally {
			await cleanup();
		}
	});

	it("finds a todo by ID", async (t: TestContext) => {
		t.plan(1);
		const { todoService, cleanup } = await setupTodoService();
		try {
			const created = await todoService.create({ title: "Find Me", userId: 1 });
			const found = await todoService.findById(created.id);
			t.assert.deepStrictEqual<TodoSchema>(found, created);
		} finally {
			await cleanup();
		}
	});

	it("updates a todo", async (t: TestContext) => {
		t.plan(2);
		const { todoService, cleanup } = await setupTodoService();
		try {
			const created = await todoService.create({
				title: "Old Title",
				userId: 1,
			});
			const updated = await todoService.update(created.id, {
				title: "New Title",
			});
			t.assert.deepStrictEqual<TodoSchema["title"]>(updated.title, "New Title");
			t.assert.deepStrictEqual<TodoSchema["userId"]>(updated.userId, 1);
		} finally {
			await cleanup();
		}
	});

	it("deletes a todo", async (t: TestContext) => {
		t.plan(2);
		const { todoService, cleanup } = await setupTodoService();
		try {
			const created = await todoService.create({
				title: "To Be Deleted",
				userId: 1,
			});
			const result = await todoService.delete(created.id);
			const todos = await todoService.findAll();

			t.assert.deepStrictEqual<TodoSchema["userId"]>(result, 1);
			t.assert.deepStrictEqual<TodoSchema[]>(todos, []);
		} finally {
			await cleanup();
		}
	});

	it("returns 0 when deleting non-existent todo", async (t: TestContext) => {
		t.plan(1);
		const { todoService, cleanup } = await setupTodoService();
		try {
			const result = await todoService.delete(9999);
			t.assert.deepStrictEqual<number>(result, 0);
		} finally {
			await cleanup();
		}
	});
});
