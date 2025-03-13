import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Repository } from "@scream.js/database/repository.js";
import knex, { type Knex } from "knex";
import config from "knexfile.js";
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
	});

	afterEach(async () => {
		await db.migrate.rollback();
		await db.destroy();
	});

	it("fetches todos", async () => {
		const todos = await todoService.findAll();

		assert.deepStrictEqual(todos, []);
	});
});
