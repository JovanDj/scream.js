import type { Database } from "@scream.js/database/db.js";
import { TodosController } from "./todo.controller.js";
import { TodoService } from "./todo.service.js";

export const createTodoModule = ({ db }: { db: Database }) => {
	const todoService = new TodoService(db);
	const todosController = new TodosController(todoService);

	return { todoService, todosController };
};
