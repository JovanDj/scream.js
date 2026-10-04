import type { Database } from "@scream.js/database/db.js";
import type { TodoShowInput } from "../todo.schema.js";

export class DeleteTodoService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(input: TodoShowInput) {
		return (await this.#db("todos").where({ id: input.id }).del()) > 0;
	}
}
