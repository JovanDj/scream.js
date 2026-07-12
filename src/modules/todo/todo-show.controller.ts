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
			action: `/todos/${todo.id}`,
			editUrl: `/todos/${todo.id}/edit`,
			homeUrl: "/",
			notesUrl: "/project-notes",
			tagsUrl: "/tags",
			todoDueAt: todo.dueAt ?? undefined,
			todoId: todo.id,
			todoStatusCode: todo.statusCode,
			todosUrl: "/todos",
			todoTitle: todo.title,
		};
	}

	protected template() {
		return "todo/show";
	}
}
