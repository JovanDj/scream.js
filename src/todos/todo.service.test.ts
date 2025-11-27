import {
	afterEach,
	beforeEach,
	describe,
	it,
	type TestContext,
} from "node:test";
import config from "@scream.js/database/knexfile.js";
import { createLogger } from "@scream.js/logger/logger-factory.js";
import knex, { type Knex } from "knex";
import { KnexTodoRepository } from "./knex-todo.repository.js";
import type { TodoRepository } from "./todo.repository.js";
import type { TodoSchema } from "./todo.schema.js";
import { TodoService } from "./todo.service.js";
import { TodoInMemoryCache } from "./todo-in-memory-cache.repository.js";

describe("TodoService", () => {
	let db: Knex;
	let todoRepository: TodoRepository;
	let todoCache: TodoRepository;
	let todoService: TodoService;

	beforeEach(async () => {
		db = knex(config["integration"] ?? "integration");
		todoRepository = new KnexTodoRepository(db);
		todoCache = new TodoInMemoryCache(
			todoRepository,
			new Map(),
			createLogger(),
		);
		todoService = new TodoService(todoCache);

		await db.migrate.latest();
		await db("users").insert({ username: "test user" });
	});

	afterEach(async () => {
		await db.migrate.rollback(undefined, true);
		await db.destroy();
	});

	it("fetches todos", async (t: TestContext) => {
		t.plan(1);
		const todos = await todoService.findAll();

		t.assert.deepStrictEqual<TodoSchema[]>(todos, []);
	});

	it("inserts a todo", async (t: TestContext) => {
		t.plan(3);
		const todo = await todoService.create({ title: "Test Todo", userId: 1 });
		t.assert.ok(todo.id);
		t.assert.deepStrictEqual<TodoSchema["title"]>(todo.title, "Test Todo");
		t.assert.deepStrictEqual<TodoSchema["userId"]>(todo.userId, 1);
	});

	it("finds a todo by ID", async (t: TestContext) => {
		t.plan(1);
		const created = await todoService.create({ title: "Find Me", userId: 1 });
		const found = await todoService.findById(created.id);
		t.assert.deepStrictEqual<TodoSchema>(found, created);
	});

	it("updates a todo", async (t: TestContext) => {
		t.plan(2);
		const created = await todoService.create({ title: "Old Title", userId: 1 });
		const updated = await todoService.update(created.id, {
			title: "New Title",
		});
		t.assert.deepStrictEqual<TodoSchema["title"]>(updated.title, "New Title");
		t.assert.deepStrictEqual<TodoSchema["userId"]>(updated.userId, 1);
	});

	it("deletes a todo", async (t: TestContext) => {
		t.plan(2);
		const created = await todoService.create({
			title: "To Be Deleted",
			userId: 1,
		});
		const result = await todoService.delete(created.id);
		const todos = await todoService.findAll();

		t.assert.deepStrictEqual<TodoSchema["userId"]>(result, 1);
		t.assert.deepStrictEqual<TodoSchema[]>(todos, []);
	});

	it("returns 0 when deleting non-existent todo", async (t: TestContext) => {
		t.plan(1);
		const result = await todoService.delete(9999);
		t.assert.deepStrictEqual<number>(result, 0);
	});
});
