import { ShowController } from "@scream.js/http/controllers/show.controller.js";
import type { TodoShowData, TodoShowInput } from "./todo.schema.js";
import { todoShowInputSchema } from "./todo.schema.js";

export class TodosShowController extends ShowController<
	TodoShowInput,
	TodoShowData
> {
	protected inputSchema() {
		return todoShowInputSchema;
	}

	protected present(todo: TodoShowData) {
		return {
			pageTitle: `Todo | ${todo.id}`,
			todoDueAt: todo.dueAt ?? "",
			todoId: todo.id,
			todoStatusCode: todo.statusCode,
			todoTitle: todo.title,
		};
	}

	protected template() {
		return "todo/show";
	}
}
