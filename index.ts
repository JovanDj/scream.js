import { createTodoModule } from "./src/core/todos/index.js";
import type { TodoRepository } from "./src/core/todos/todo.repository.js";

export const createCoreServices = ({
	todoRepository,
}: {
	todoRepository: TodoRepository;
}) => {
	const { todoService } = createTodoModule(todoRepository);

	return { todoService };
};
