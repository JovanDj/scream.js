import type { Connection } from "@scream.js/database/connection.js";
import { sql } from "@scream.js/database/query-builder/sql-template-string.js";
import { TableModel } from "@scream.js/database/table-model.js";
import { schema } from "@scream.js/validator/schema.js";

export class TodoModel extends TableModel {
	constructor(connection: Connection) {
		super(connection, "todos");
	}

	async list(input: {
		search: string;
		scope: "all" | "completed" | "dueToday" | "open";
	}) {
		const rows = await this.connection.all(
			sql`SELECT
				todos.id,
				todos.title,
				todo_statuses.code AS status_code
			FROM todos
			INNER JOIN todo_statuses ON todos.status_id = todo_statuses.id
			WHERE todos.title LIKE ${`%${input.search}%`}
				AND (
					${input.scope} = 'all'
					OR (${input.scope} = 'open' AND todo_statuses.code = 'open')
					OR (
						${input.scope} = 'completed'
						AND todo_statuses.code = 'completed'
					)
					OR (
						${input.scope} = 'dueToday'
						AND todo_statuses.code = 'open'
						AND date(todos.due_at) = date('now', 'localtime')
					)
				)
			ORDER BY todos.id DESC`,
		);

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

	async find(id: number) {
		const row = await this.connection.get(
			sql`SELECT
				todos.id,
				todos.title,
				todo_statuses.code AS status_code
			FROM todos
			INNER JOIN todo_statuses ON todos.status_id = todo_statuses.id
			WHERE todos.id = ${id}`,
		);
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

	async create(input: { title: string }) {
		return this.connection.transaction(async (transaction) => {
			const idSchema = schema.object({
				id: schema.coerce.number().int().positive(),
			});
			const priority = idSchema.parse(
				await transaction.get(
					sql`SELECT id FROM todo_priorities WHERE code = ${"medium"}`,
				),
			);
			const status = idSchema.parse(
				await transaction.get(
					sql`SELECT id FROM todo_statuses WHERE code = ${"open"}`,
				),
			);

			const now = new Date().toISOString();
			const result = await this.insert(
				{
					completed_at: null,
					created_at: now,
					description: "",
					due_at: null,
					priority_id: priority.id,
					status_id: status.id,
					title: input.title,
					updated_at: now,
				},
				transaction,
			);

			return schema.coerce.number().int().positive().parse(result.insertedId());
		});
	}

	async update(input: {
		id: number;
		statusCode: "completed" | "open";
		title: string;
	}) {
		return this.connection.transaction(async (transaction) => {
			const currentRow = await this.findById<{
				completed_at: string | null;
			}>(input.id, transaction);
			if (currentRow === undefined) {
				return undefined;
			}

			const idSchema = schema.object({
				id: schema.coerce.number().int().positive(),
			});
			const priority = idSchema.parse(
				await transaction.get(
					sql`SELECT id FROM todo_priorities WHERE code = ${"medium"}`,
				),
			);
			const status = idSchema.parse(
				await transaction.get(
					sql`SELECT id FROM todo_statuses WHERE code = ${input.statusCode}`,
				),
			);

			const now = new Date().toISOString();
			const completedAt =
				input.statusCode === "completed"
					? (currentRow.completed_at ?? now)
					: null;
			const result = await this.updateById(
				input.id,
				{
					completed_at: completedAt,
					priority_id: priority.id,
					status_id: status.id,
					title: input.title,
					updated_at: now,
				},
				transaction,
			);

			return result.affectedRows() > 0 ? input.id : undefined;
		});
	}

	async destroy(id: number) {
		const result = await this.deleteById(id);

		return result.affectedRows() > 0;
	}
}
