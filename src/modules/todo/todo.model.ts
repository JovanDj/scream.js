import type { SqliteDatabase } from "@scream.js/database/db.js";
import { Model } from "@scream.js/database/model.js";
import { schema } from "@scream.js/validator/schema.js";

export class TodoModel extends Model {
	constructor(db: SqliteDatabase) {
		super(db, "todos");
	}

	list(input: {
		search: string;
		scope: "all" | "completed" | "dueToday" | "open";
	}) {
		const rows = this.db
			.prepare<
				{ scope: typeof input.scope; search: string },
				{ id: number; status_code: string; title: string }
			>(
				`SELECT
					todos.id,
					todos.title,
					todo_statuses.code AS status_code
				FROM todos
				INNER JOIN todo_statuses ON todos.status_id = todo_statuses.id
				WHERE todos.title LIKE @search
					AND (
						@scope = 'all'
						OR (@scope = 'open' AND todo_statuses.code = 'open')
						OR (@scope = 'completed' AND todo_statuses.code = 'completed')
						OR (
							@scope = 'dueToday'
							AND todo_statuses.code = 'open'
							AND date(todos.due_at) = date('now', 'localtime')
						)
					)
				ORDER BY todos.id DESC`,
			)
			.all({ scope: input.scope, search: `%${input.search}%` });

		return schema
			.array(
				schema.object({
					id: schema.coerce.number().int().positive(),
					status_code: schema.enum(["open", "completed"]),
					title: schema.string().nonempty(),
				}),
			)
			.transform((parsedRows) =>
				parsedRows.map((row) => ({
					id: row.id,
					statusCode: row.status_code,
					title: row.title,
				})),
			)
			.parse(rows);
	}

	find(id: number) {
		const row = this.db
			.prepare<[number], { id: number; status_code: string; title: string }>(
				`SELECT
					todos.id,
					todos.title,
					todo_statuses.code AS status_code
				FROM todos
				INNER JOIN todo_statuses ON todos.status_id = todo_statuses.id
				WHERE todos.id = ?`,
			)
			.get(id);
		if (row === undefined) {
			return undefined;
		}

		return schema
			.object({
				id: schema.coerce.number().int().positive(),
				status_code: schema.enum(["open", "completed"]),
				title: schema.string().nonempty(),
			})
			.transform((parsedRow) => ({
				id: parsedRow.id,
				statusCode: parsedRow.status_code,
				title: parsedRow.title,
			}))
			.parse(row);
	}

	create(input: { title: string }) {
		return this.db.transaction(() => {
			const idSchema = schema.object({
				id: schema.coerce.number().int().positive(),
			});
			const priority = idSchema.parse(
				this.db
					.prepare<[string], { id: number }>(
						"SELECT id FROM todo_priorities WHERE code = ?",
					)
					.get("medium"),
			);
			const status = idSchema.parse(
				this.db
					.prepare<[string], { id: number }>(
						"SELECT id FROM todo_statuses WHERE code = ?",
					)
					.get("open"),
			);

			const now = new Date().toISOString();
			const result = this.insert({
				completed_at: null,
				created_at: now,
				description: "",
				due_at: null,
				priority_id: priority.id,
				status_id: status.id,
				title: input.title,
				updated_at: now,
			});

			return schema.coerce
				.number()
				.int()
				.positive()
				.parse(result.lastInsertRowid);
		})();
	}

	update(input: {
		id: number;
		statusCode: "completed" | "open";
		title: string;
	}) {
		return this.db.transaction(() => {
			const currentRow = this.findById<{ completed_at: string | null }>(
				input.id,
			);
			if (currentRow === undefined) {
				return undefined;
			}

			const idSchema = schema.object({
				id: schema.coerce.number().int().positive(),
			});
			const priority = idSchema.parse(
				this.db
					.prepare<[string], { id: number }>(
						"SELECT id FROM todo_priorities WHERE code = ?",
					)
					.get("medium"),
			);
			const status = idSchema.parse(
				this.db
					.prepare<[string], { id: number }>(
						"SELECT id FROM todo_statuses WHERE code = ?",
					)
					.get(input.statusCode),
			);

			const now = new Date().toISOString();
			const completedAt =
				input.statusCode === "completed"
					? (currentRow.completed_at ?? now)
					: null;

			this.updateById(input.id, {
				completed_at: completedAt,
				priority_id: priority.id,
				status_id: status.id,
				title: input.title,
				updated_at: now,
			});

			return input.id;
		})();
	}

	destroy(id: number) {
		return this.deleteById(id);
	}
}
