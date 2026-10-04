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
			errors: { dueAt: "", title: "" },
			fields: {
				dueAt: todo.dueAt ?? "",
				isCompleted: todo.statusCode === "completed",
				isOpen: todo.statusCode === "open",
				statusCode: todo.statusCode,
				title: todo.title,
			},
			pageTitle: "New Todo",
		};
	}

	protected template() {
		return "todo/create";
	}
}
