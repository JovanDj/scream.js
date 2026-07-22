import type { Connection } from "@scream.js/database/connection.js";
import { sql } from "@scream.js/database/query-builder/sql-template-string.js";
import { TableModel } from "@scream.js/database/table-model.js";
import { schema } from "@scream.js/validator/schema.js";

export class TagModel extends TableModel {
	constructor(connection: Connection) {
		super(connection, "tags");
	}

	async list() {
		const rows = await this.connection.all(
			sql`SELECT id, name FROM tags ORDER BY name ASC`,
		);

		return schema
			.array(
				schema.object({
					id: schema.coerce.number().int().positive(),
					name: schema.string(),
				}),
			)
			.parse(rows);
	}

	async create(name: string) {
		const now = new Date().toISOString();
		await this.insert({ created_at: now, name, updated_at: now });
	}

	async destroy(id: number) {
		const result = await this.deleteById(id);

		return result.affectedRows() > 0;
	}

	async assignToTodo(todoId: number, tagIds: readonly number[]) {
		return this.connection.transaction(async (transaction) => {
			const todo = await transaction.get(
				sql`SELECT id FROM todos WHERE id = ${todoId}`,
			);
			if (todo === undefined) {
				return false;
			}
			schema
				.object({ id: schema.coerce.number().int().positive() })
				.parse(todo);

			const uniqueTagIds = [...new Set(tagIds)];
			if (uniqueTagIds.length > 0) {
				const matchedTags = schema
					.object({
						count: schema.coerce.number().int().nonnegative(),
					})
					.parse(
						await transaction.get(
							sql`SELECT COUNT(*) AS count
							FROM tags
							WHERE id IN (${uniqueTagIds})`,
						),
					);
				if (matchedTags.count !== uniqueTagIds.length) {
					return false;
				}
			}

			await transaction.run(
				sql`DELETE FROM todo_tags WHERE todo_id = ${todoId}`,
			);

			const now = new Date().toISOString();
			for (const tagId of uniqueTagIds) {
				await transaction.run(
					sql`INSERT INTO todo_tags (created_at, tag_id, todo_id)
					VALUES (${now}, ${tagId}, ${todoId})`,
				);
			}

			const result = await transaction.run(
				sql`UPDATE todos SET updated_at = ${now} WHERE id = ${todoId}`,
			);

			return result.affectedRows() > 0;
		});
	}
}
