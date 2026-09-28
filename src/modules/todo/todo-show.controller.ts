import type { Database } from "@scream.js/database/db.js";
import { ShowController } from "../show.controller.js";
import type { TodoShowData, TodoShowInput } from "./todo.schema.js";
import { todoShowDataSchema, todoShowInputSchema } from "./todo.schema.js";

export class TodosShowController extends ShowController<
	TodoShowInput,
	TodoShowData
> {
	protected inputSchema() {
		return todoShowInputSchema;
	}

	protected async load(input: TodoShowInput, db: Database) {
		return db("todos")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": input.id })
			.select(
				"todos.due_at",
				"todos.id",
				"todos.title",
				db.ref("todo_statuses.code").as("status_code"),
			)
			.first();
	}

	protected dataSchema() {
		return todoShowDataSchema;
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
		return "show";
	}
}
