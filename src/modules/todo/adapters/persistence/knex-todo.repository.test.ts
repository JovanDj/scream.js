import { describe, it, type TestContext } from "node:test";
import { testDatabase } from "@scream.js/database/test-helpers.js";
import type { TodoRepository } from "src/modules/todo/application/todo.repository.js";
import type { Todo } from "src/modules/todo/domain/todo.js";
import { KnexTodoRepository } from "./knex-todo.repository.js";

describe("KnexTodoRepository", { concurrency: true }, () => {
	const setupTestDatabase = async () => {
		const { cleanup, db } = await testDatabase.setup({
			prepare: async (database) => {
				await database("users").insert({ username: "test user" });
			},
		});
		const knexTodoRepository: TodoRepository = new KnexTodoRepository(db);

		return { cleanup, knexTodoRepository };
	};

	it("returns an empty list when there are no todos", async (t: TestContext) => {
		t.plan(1);
		const { cleanup, knexTodoRepository } = await setupTestDatabase();

		try {
			const todos = await knexTodoRepository.findAll();

			t.assert.deepStrictEqual<Todo[]>(todos, []);
		} finally {
			await cleanup();
		}
	});

	it("inserts a todo and returns the persisted record", async (t: TestContext) => {
		t.plan(4);
		const { cleanup, knexTodoRepository } = await setupTestDatabase();

		try {
			const todo = await knexTodoRepository.insert({
				completed: false,
				title: "Write more tests",
			});

			t.assert.ok(todo.id);
			t.assert.deepStrictEqual<Todo["title"]>(todo.title, "Write more tests");
			t.assert.deepStrictEqual<Todo["userId"]>(todo.userId, 1);
			t.assert.deepStrictEqual<Todo["completed"]>(todo.completed, false);
		} finally {
			await cleanup();
		}
	});

	it("finds a todo by id", async (t: TestContext) => {
		t.plan(2);
		const { cleanup, knexTodoRepository } = await setupTestDatabase();

		try {
			const created = await knexTodoRepository.insert({
				completed: false,
				title: "Find me",
			});

			const found = await knexTodoRepository.findById(created.id);

			t.assert.deepStrictEqual<Todo | undefined>(found, created);
			t.assert.deepStrictEqual<boolean>(created.completed, false);
		} finally {
			await cleanup();
		}
	});

	it("returns undefined when looking up a missing todo", async (t: TestContext) => {
		t.plan(1);
		const { cleanup, knexTodoRepository } = await setupTestDatabase();

		try {
			const found = await knexTodoRepository.findById(9999);

			t.assert.deepStrictEqual<Todo | undefined>(found, undefined);
		} finally {
			await cleanup();
		}
	});

	it("lists all persisted todos", async (t: TestContext) => {
		t.plan(1);
		const { cleanup, knexTodoRepository } = await setupTestDatabase();

		try {
			const first = await knexTodoRepository.insert({
				completed: false,
				title: "First todo",
			});
			const second = await knexTodoRepository.insert({
				completed: false,
				title: "Second todo",
			});

			const todos = await knexTodoRepository.findAll();

			t.assert.deepStrictEqual<Todo[]>(todos, [first, second]);
		} finally {
			await cleanup();
		}
	});

	it("updates a todo title", async (t: TestContext) => {
		t.plan(3);
		const { cleanup, knexTodoRepository } = await setupTestDatabase();

		try {
			const created = await knexTodoRepository.insert({
				completed: false,
				title: "Old title",
			});

			const updated = await knexTodoRepository.update(created.id, {
				completed: false,
				title: "New title",
			});

			t.assert.deepStrictEqual<Todo["title"]>(updated.title, "New title");
			t.assert.deepStrictEqual<Todo["completed"]>(updated.completed, false);

			const found = await knexTodoRepository.findById(created.id);
			t.assert.deepStrictEqual<Todo | undefined>(found, updated);
		} finally {
			await cleanup();
		}
	});

	it("updates completion status", async (t: TestContext) => {
		t.plan(2);
		const { cleanup, knexTodoRepository } = await setupTestDatabase();

		try {
			const created = await knexTodoRepository.insert({
				completed: false,
				title: "Complete me",
			});

			const updated = await knexTodoRepository.update(created.id, {
				completed: true,
				title: "Complete me",
			});

			t.assert.deepStrictEqual<Todo["completed"]>(updated.completed, true);

			const found = await knexTodoRepository.findById(created.id);
			t.assert.deepStrictEqual<Todo | undefined>(found, updated);
		} finally {
			await cleanup();
		}
	});

	it("throws when updating a missing todo", async (t: TestContext) => {
		t.plan(1);
		const { cleanup, knexTodoRepository } = await setupTestDatabase();

		try {
			await t.assert.rejects(
				() =>
					knexTodoRepository.update(12345, {
						completed: false,
						title: "ghost",
					}),
				/Todo was updated but could not be found/i,
			);
		} finally {
			await cleanup();
		}
	});

	it("deletes a todo and reports affected rows", async (t: TestContext) => {
		t.plan(2);
		const { cleanup, knexTodoRepository } = await setupTestDatabase();

		try {
			const created = await knexTodoRepository.insert({
				completed: false,
				title: "To delete",
			});

			const affectedRows = await knexTodoRepository.delete(created.id);
			const todos = await knexTodoRepository.findAll();

			t.assert.deepStrictEqual<number>(affectedRows, 1);
			t.assert.deepStrictEqual<Todo[]>(todos, []);
		} finally {
			await cleanup();
		}
	});

	it("returns zero affected rows when deleting a missing todo", async (t: TestContext) => {
		t.plan(1);
		const { cleanup, knexTodoRepository } = await setupTestDatabase();

		try {
			const affectedRows = await knexTodoRepository.delete(9999);

			t.assert.deepStrictEqual<number>(affectedRows, 0);
		} finally {
			await cleanup();
		}
	});

	// With a single hardcoded user, ownership is enforced inside the repository.
});
