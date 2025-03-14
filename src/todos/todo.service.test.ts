import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import knex, { type Knex } from "knex";
import config from "knexfile.js";

import type { Repository } from "@scream.js/database/repository.js";

import { TodoRepository } from "./todo.repository.js";
import type { TodoSchema } from "./todo.schema.js";
import { TodoService } from "./todo.service.js";

describe("TodoService", () => {
	let db: Knex;
	let todoRepository: Repository<TodoSchema>;
	let todoService: TodoService;

	beforeEach(async () => {
		db = knex(config["test"] ?? "test");
		todoRepository = new TodoRepository(db);
		todoService = new TodoService(todoRepository);

		await db.migrate.latest();
		await db("users").insert({ username: "test user" });
	});

	afterEach(async () => {
		await db.migrate.rollback();
		await db.destroy();
	});

	it("fetches todos", async () => {
		const todos = await todoService.findAll();

		assert.deepStrictEqual(todos, []);
	});

	it("inserts a todo", async () => {
		const todo = await todoService.create({ title: "Test Todo", userId: 1 });
		assert.ok(todo.id);
		assert.deepStrictEqual(todo.title, "Test Todo");
		assert.deepStrictEqual(todo.userId, 1);
	});

	it("finds a todo by ID", async () => {
		const created = await todoService.create({ title: "Find Me", userId: 1 });
		const found = await todoService.findById(created.id);
		assert.deepStrictEqual(found, created);
	});

	it("updates a todo", async () => {
		const created = await todoService.create({ title: "Old Title", userId: 1 });
		const updated = await todoService.update(created.id, {
			title: "New Title",
		});
		assert.deepStrictEqual(updated.title, "New Title");
		assert.deepStrictEqual(updated.userId, 1);
	});

	it("deletes a todo", async () => {
		const created = await todoService.create({
			title: "To Be Deleted",
			userId: 1,
		});
		const result = await todoService.delete(created.id);
		assert.deepStrictEqual(result, 1);
		const todos = await todoService.findAll();
		assert.deepStrictEqual(todos, []);
	});

	it("returns 0 when deleting non-existent todo", async () => {
		const result = await todoService.delete(9999);
		assert.deepStrictEqual(result, 0);
	});
});
