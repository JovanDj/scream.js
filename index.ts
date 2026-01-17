import { createTodoModule } from "./src/modules/todo/application/index.js";
import type { TodoRepository } from "./src/modules/todo/application/todo.repository.js";

export const createCoreServices = ({
	todoRepository,
}: {
	todoRepository: TodoRepository;
}) => {
	const { todoService } = createTodoModule(todoRepository);

	return { todoService };
};
