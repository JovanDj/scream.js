import { TodosController } from "./todo.controller.js";
import type { TodoRepository } from "./todo.service.js";
import { TodoService } from "./todo.service.js";

export const createTodoModule = ({
	todoRepository,
}: {
	todoRepository: TodoRepository;
}) => {
	const todoService = new TodoService(todoRepository);
	const todosController = new TodosController(todoService);

	return { todoRepository, todoService, todosController };
};
