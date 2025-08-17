import { createLogger } from "@scream.js/logger/logger-factory.js";

import { db } from "config/database.js";
import { KnexTodoRepository } from "./knex-todo.repository.js";
import { TodoInMemoryCache } from "./todo-in-memory-cache.repository.js";
import type { TodoRepository } from "./todo.repository.js";
import type { TodoSchema } from "./todo.schema.js";
import { TodoService } from "./todo.service.js";
import { TodosController } from "./todos.controller.js";

const todoRepository: TodoRepository = new KnexTodoRepository(db);
const todoCache: TodoRepository = new TodoInMemoryCache(
	todoRepository,
	new Map<number, TodoSchema>(),
	createLogger(),
);
const todoService = new TodoService(todoCache);
export const todoController = new TodosController(todoService);
