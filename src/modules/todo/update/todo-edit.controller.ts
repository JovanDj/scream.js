import { EditController } from "@scream.js/http/controllers/edit.controller.js";
import {
	type TodoShowData,
	type TodoShowInput,
	todoShowInputSchema,
} from "../todo.schema.js";

export class TodosEditController extends EditController<
	TodoShowInput,
	TodoShowData
> {
	protected inputSchema() {
		return todoShowInputSchema;
	}

	protected present(todo: TodoShowData) {
		return {
			action: `/todos/${todo.id}`,
			errors: {},
			fields: {
				dueAt: todo.dueAt ?? "",
				isCompleted: todo.statusCode === "completed" ? true : undefined,
				isOpen: todo.statusCode === "open" ? true : undefined,
				statusCode: todo.statusCode,
				title: todo.title,
			},
			homeUrl: "/",
			notesUrl: "/project-notes",
			tagsUrl: "/tags",
			todoId: todo.id,
			todosUrl: "/todos",
			todoUrl: `/todos/${todo.id}`,
		};
	}

	protected template() {
		return "todo/edit";
	}
}
