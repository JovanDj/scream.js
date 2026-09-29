import type { Database } from "@scream.js/database/db.js";
import { type TodoShowInput, todoShowDataSchema } from "./todo.schema.js";

export class GetTodoService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute({ id }: TodoShowInput) {
		const row = await this.#db("todos")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": id })
			.select(
				"todos.due_at",
				"todos.id",
				"todos.title",
				this.#db.ref("todo_statuses.code").as("status_code"),
			)
			.first();

		return row ? todoShowDataSchema.parse(row) : undefined;
	}
}
