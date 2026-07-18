import type { Connection } from "@scream.js/database/connection.js";
import { sql } from "@scream.js/database/query-builder/sql-template-string.js";
import { TableModel } from "@scream.js/database/table-model.js";
import { schema } from "@scream.js/validator/schema.js";

const projectRowSchema = schema
	.object({
		id: schema.coerce.number().int().positive(),
		name: schema.string(),
		status_code: schema.enum(["active", "archived"]),
	})
	.transform((row) => ({
		id: row.id,
		name: row.name,
		statusCode: row.status_code,
	}));

export class ProjectModel extends TableModel {
	constructor(connection: Connection) {
		super(connection, "projects");
	}

	async list() {
		const rows = await this.connection.all(
			sql`SELECT
				projects.id,
				projects.name,
				project_statuses.code AS status_code
			FROM projects
			INNER JOIN project_statuses
				ON projects.status_id = project_statuses.id
			ORDER BY projects.id DESC`,
		);

		return schema.array(projectRowSchema).parse(rows);
	}

	async find(id: number) {
		const row = await this.connection.get(
			sql`SELECT
				projects.id,
				projects.name,
				project_statuses.code AS status_code
			FROM projects
			INNER JOIN project_statuses
				ON projects.status_id = project_statuses.id
			WHERE projects.id = ${id}`,
		);

		return row === undefined ? undefined : projectRowSchema.parse(row);
	}

	async create(name: string) {
		return this.connection.transaction(async (transaction) => {
			const status = schema
				.object({ id: schema.coerce.number().int().positive() })
				.parse(
					await transaction.get(
						sql`SELECT id FROM project_statuses WHERE code = ${"active"}`,
					),
				);
			const now = new Date().toISOString();
			const result = await this.insert(
				{
					created_at: now,
					name,
					status_id: status.id,
					updated_at: now,
				},
				transaction,
			);

			return schema.coerce.number().int().positive().parse(result.insertedId());
		});
	}

	async archive(id: number) {
		return this.#setStatus(id, "archived");
	}

	async unarchive(id: number) {
		return this.#setStatus(id, "active");
	}

	async #setStatus(id: number, statusCode: "active" | "archived") {
		const result = await this.connection.run(
			sql`UPDATE projects
			SET
				status_id = (
					SELECT id FROM project_statuses WHERE code = ${statusCode}
				),
				updated_at = ${new Date().toISOString()}
			WHERE id = ${id}`,
		);

		return result.affectedRows() > 0 ? id : undefined;
	}
}
