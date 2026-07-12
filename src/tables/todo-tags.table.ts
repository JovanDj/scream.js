import type { Database } from "@scream.js/database/db.js";

export class TodoTagsTable {
	readonly #db: Database;

	static create(db: Database) {
		return new TodoTagsTable(db);
	}

	private constructor(db: Database) {
		this.#db = db;
	}

	async replaceForTodo(todoId: number, tagIds: readonly number[]) {
		await this.#db("todo_tags").where({ todo_id: todoId }).del();
		if (tagIds.length === 0) {
			return;
		}

		const timestamp = new Date().toISOString();
		await this.#db("todo_tags").insert(
			tagIds.map((tagId) => ({
				created_at: timestamp,
				tag_id: tagId,
				todo_id: todoId,
			})),
		);
	}
}
