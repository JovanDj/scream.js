import { EditController } from "@scream.js/http/controllers/edit.controller.js";
import {
	type TodoShowData,
	type TodoShowInput,
	todoShowInputSchema,
} from "./todo.schema.js";

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
			errors: { dueAt: "", title: "" },
			fields: {
				dueAt: todo.dueAt ?? "",
				isCompleted: todo.statusCode === "completed",
				isOpen: todo.statusCode === "open",
				statusCode: todo.statusCode,
				title: todo.title,
			},
			pageTitle: `Edit Todo #${todo.id}`,
			submitLabel: "Update",
			todoId: todo.id,
		};
	}

	protected template() {
		return "edit";
	}
}
