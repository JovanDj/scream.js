import { createLogger } from "@scream.js/logger/logger-factory.js";
import type { Knex } from "knex";
import { KnexTodoRepository } from "./knex-todo.repository.js";
import type { TodoRepository } from "./todo.repository.js";
import type { TodoSchema } from "./todo.schema.js";
import { TodoService } from "./todo.service.js";
import { TodoInMemoryCache } from "./todo-in-memory-cache.repository.js";
import { TodosController } from "./todos.controller.js";

export const createTodoModule = (db: Knex) => {
	const todoRepository: TodoRepository = new KnexTodoRepository(db);
	const todoCache: TodoRepository = new TodoInMemoryCache(
		todoRepository,
		new Map<number, TodoSchema>(),
		createLogger(),
	);
	const todoService = new TodoService(todoCache);
	const todoController = new TodosController(todoService);

	return { todoController, todoService };
};
