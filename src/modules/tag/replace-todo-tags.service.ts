import type { Database } from "@scream.js/database/db.js";
import type {
	CommandHandler,
	CommandHandlerFactory,
} from "../command-handler.js";

export type ReplaceTodoTags = {
	todoId: number;
	tagIds: readonly number[];
};

export class ReplaceTodoTagsService
	implements CommandHandler<ReplaceTodoTags, boolean>
{
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute({ todoId, tagIds }: ReplaceTodoTags) {
		const uniqueTagIds = tagIds.filter(
			(tagId, index) => tagIds.indexOf(tagId) === index,
		);
		const todo = await this.#db("todos").where({ id: todoId }).first("id");
		if (!todo) {
			return false;
		}

		if (uniqueTagIds.length > 0) {
			const matchedTags = await this.#db("tags")
				.whereIn("id", uniqueTagIds)
				.select("id");
			if (matchedTags.length !== uniqueTagIds.length) {
				return false;
			}
		}

		await this.#db("todo_tags").where({ todo_id: todoId }).del();
		if (uniqueTagIds.length > 0) {
			await this.#db("todo_tags").insert(
				uniqueTagIds.map((tagId) => ({
					created_at: new Date().toISOString(),
					tag_id: tagId,
					todo_id: todoId,
				})),
			);
		}

		const affectedRows = await this.#db("todos")
			.where({ id: todoId })
			.update({ updated_at: new Date().toISOString() });
		return affectedRows > 0;
	}
}

export class ReplaceTodoTagsServiceFactory
	implements CommandHandlerFactory<ReplaceTodoTags, boolean>
{
	create(tx: Database) {
		return new ReplaceTodoTagsService(tx);
	}
}
