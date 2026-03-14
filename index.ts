import type { Database } from "@scream.js/database/db.js";
import { createTodoModule } from "@/modules/todo";
import { KnexTodoRepository } from "./src/modules/todo/todo.repository.js";

export const createCoreServices = ({ db }: { db: Database }) => {
	const { todoService } = createTodoModule({
		todoRepository: KnexTodoRepository.create(db),
	});

	return { todoService };
};
