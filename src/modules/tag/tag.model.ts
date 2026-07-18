import type { SqliteDatabase } from "@scream.js/database/db.js";
import { Model } from "@scream.js/database/model.js";
import { schema } from "@scream.js/validator/schema.js";

export class TagModel extends Model {
	constructor(db: SqliteDatabase) {
		super(db, "tags");
	}

	list() {
		const rows = this.db
			.prepare<[], { id: number; name: string }>(
				"SELECT id, name FROM tags ORDER BY name ASC",
			)
			.all();

		return schema
			.array(
				schema.object({
					id: schema.coerce.number().int().positive(),
					name: schema.string(),
				}),
			)
			.parse(rows);
	}

	create(name: string) {
		const now = new Date().toISOString();
		this.insert({ created_at: now, name, updated_at: now });
	}

	destroy(id: number) {
		return this.deleteById(id);
	}

	assignToTodo(todoId: number, tagIds: readonly number[]) {
		return this.db.transaction(() => {
			if (
				this.db
					.prepare<[number]>("SELECT id FROM todos WHERE id = ?")
					.get(todoId) === undefined
			) {
				return false;
			}

			const uniqueTagIds = [...new Set(tagIds)];
			if (uniqueTagIds.length > 0) {
				const placeholders = uniqueTagIds.map(() => "?").join(", ");
				const matchedTags = schema
					.object({
						count: schema.coerce.number().int().nonnegative(),
					})
					.parse(
						this.db
							.prepare<unknown[], { count: number }>(
								`SELECT COUNT(*) AS count FROM tags WHERE id IN (${placeholders})`,
							)
							.get(...uniqueTagIds),
					);
				if (matchedTags.count !== uniqueTagIds.length) {
					return false;
				}
			}

			this.db
				.prepare<[number]>("DELETE FROM todo_tags WHERE todo_id = ?")
				.run(todoId);

			const now = new Date().toISOString();
			const insertTag = this.db.prepare(
				"INSERT INTO todo_tags (created_at, tag_id, todo_id) VALUES (?, ?, ?)",
			);
			for (const tagId of uniqueTagIds) {
				insertTag.run(now, tagId, todoId);
			}

			this.db
				.prepare<[string, number]>(
					"UPDATE todos SET updated_at = ? WHERE id = ?",
				)
				.run(now, todoId);

			return true;
		})();
	}
}
