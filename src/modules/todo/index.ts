import type { Knex } from "knex";
import { TodosController } from "./todo.controller.js";
import { TodoService } from "./todo.service.js";

export const createTodoModule = ({ db }: { db: Knex }) => {
	// Single-use composition seam is kept intentionally for app bootstrap boundaries.
	const todoService = new TodoService(db);
	const todosController = new TodosController(todoService);

	return { todoService, todosController };
};
