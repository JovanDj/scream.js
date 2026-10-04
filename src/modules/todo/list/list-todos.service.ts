import type { Database } from "@scream.js/database/db.js";
import { type TodoIndexInput, todoIndexDataSchema } from "../todo.schema.js";

export class ListTodosService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(
		input: TodoIndexInput & { readonly limit: number; readonly offset: number },
	) {
		const query = this.#db("todos")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.select(
				"todos.id",
				"todos.title",
				this.#db.ref("todo_statuses.code").as("status_code"),
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

		query.orderBy(this.#sortColumn(input.sort), input.direction);
		if (input.sort !== "created") {
			query.orderBy("todos.id", "desc");
		}

		const rows = await query.limit(input.limit).offset(input.offset);
		return todoIndexDataSchema.parse(rows);
	}

	#sortColumn(sort: TodoIndexInput["sort"]) {
		switch (sort) {
			case "created":
				return "todos.id";
			case "status":
				return "todo_statuses.code";
			case "title":
				return "todos.title";
		}
	}
}
