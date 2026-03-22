import type { Database } from "@scream.js/database/db.js";
import { TodosController } from "./todo.controller.js";

export const createTodoModule = ({ db }: { db: Database }) => {
	const todosController = new TodosController(db);

	return { todosController };
};
