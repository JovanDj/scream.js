import { CreateController } from "@scream.js/http/controllers/create.controller.js";
import {
	type TodoCreateData,
	type TodoCreateInput,
	todoCreateInputSchema,
} from "../todo.schema.js";

export class TodosCreateController extends CreateController<
	TodoCreateInput,
	TodoCreateData
> {
	protected inputSchema() {
		return todoCreateInputSchema;
	}

	protected load() {
		const data: TodoCreateData = {
			dueAt: "",
			statusCode: "open",
			title: "",
		};
		return data;
	}

	protected present(todo: TodoCreateData) {
		return {
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
			todosUrl: "/todos",
		};
	}

	protected template() {
		return "todo/create";
	}
}
