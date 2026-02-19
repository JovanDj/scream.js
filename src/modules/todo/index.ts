import type { Knex } from "knex";
import { TodosController } from "./todo.controller.js";
import { TodoService } from "./todo.service.js";

export const createTodoModule = ({ db }: { db: Knex }) => {
	const todoService = new TodoService(db);
	const todosController = new TodosController(todoService);

	return { todoService, todosController };
};
