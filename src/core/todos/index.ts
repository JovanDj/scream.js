import type { TodoRepository } from "./todo.repository.js";
import { TodoService } from "./todo.service.js";

export const createTodoModule = (todoRepository: TodoRepository) => {
	const todoService = new TodoService(todoRepository);

	return { todoService };
};
