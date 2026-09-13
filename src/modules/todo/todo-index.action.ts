import type { Database } from "@scream.js/database/db.js";
import { IndexAction } from "../index.action.js";
import type { TodoIndexData, TodoIndexInput } from "./todo.schema.js";
import { todoIndexDataSchema, todoIndexInputSchema } from "./todo.schema.js";

export class TodosIndexAction extends IndexAction<
	TodoIndexInput,
	TodoIndexData
> {
	protected inputSchema() {
		return todoIndexInputSchema;
	}

	protected async load(input: TodoIndexInput, db: Database) {
		const query = db("todos")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.select(
				"todos.id",
				"todos.title",
				db.ref("todo_statuses.code").as("status_code"),
			);

		if (input.search.length > 0) {
			query.andWhereLike("todos.title", `%${input.search}%`);
		}
		if (input.status === "open") {
			query.where({ "todo_statuses.code": "open" });
		}
		if (input.status === "completed") {
			query.where({ "todo_statuses.code": "completed" });
		}
		if (input.status === "dueToday") {
			query.where({ "todo_statuses.code": "open" });
			query.whereRaw("date(todos.due_at) = date('now', 'localtime')");
		}

		return query.orderBy("todos.id", "desc");
	}

	protected dataSchema() {
		return todoIndexDataSchema;
	}

	protected present(todos: TodoIndexData, input: TodoIndexInput) {
		const createFilterUrl = (status: TodoIndexInput["status"]) => {
			const params = new URLSearchParams();
			if (status !== "all") {
				params.set("status", status);
			}
			if (input.search.length > 0) {
				params.set("search", input.search);
			}

			const query = params.toString();
			return query.length > 0 ? `/todos?${query}` : "/todos";
		};

		return {
			filters: {
				all: createFilterUrl("all"),
				completed: createFilterUrl("completed"),
				open: createFilterUrl("open"),
			},
			pageTitle: "Todos",
			search: input.search,
			status: input.status,
			todos,
		};
	}

	protected template() {
		return "index";
	}
}
