import { TodosController } from "./todo.controller.js";

export const createTodoModule = () => {
	const todosController = new TodosController();

	return { todosController };
};
