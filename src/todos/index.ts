import { logger } from "config/logger.js";
import { db } from "../../config/database.js";
import { TodoIdentityMap } from "./todo.identity-map.js";
import type { Todo } from "./todo.js";
import { TodoMapper } from "./todo.mapper.js";
import { TodoRepository } from "./todo.repository.js";
import { TodosController } from "./todos.controller.js";

const todoMapper = new TodoMapper(db);
const todoRepository = new TodoRepository(todoMapper);
const identityMap = new TodoIdentityMap(
	todoRepository,
	new Map<Todo["id"], Todo>(),
	logger,
);
export const todoController = new TodosController(identityMap);
