import type { SqliteDatabase } from "@scream.js/database/db.js";
import { Model } from "@scream.js/database/model.js";
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

export class ProjectModel extends Model {
	constructor(db: SqliteDatabase) {
		super(db, "projects");
	}

	list() {
		const rows = this.db
			.prepare<[], { id: number; name: string; status_code: string }>(
				`SELECT
					projects.id,
					projects.name,
					project_statuses.code AS status_code
				FROM projects
				INNER JOIN project_statuses
					ON projects.status_id = project_statuses.id
				ORDER BY projects.id DESC`,
			)
			.all();

		return schema.array(projectRowSchema).parse(rows);
	}

	find(id: number) {
		const row = this.db
			.prepare<[number], { id: number; name: string; status_code: string }>(
				`SELECT
					projects.id,
					projects.name,
					project_statuses.code AS status_code
				FROM projects
				INNER JOIN project_statuses
					ON projects.status_id = project_statuses.id
				WHERE projects.id = ?`,
			)
			.get(id);

		return row === undefined ? undefined : projectRowSchema.parse(row);
	}

	create(name: string) {
		return this.db.transaction(() => {
			const status = schema
				.object({ id: schema.coerce.number().int().positive() })
				.parse(
					this.db
						.prepare<[string], { id: number }>(
							"SELECT id FROM project_statuses WHERE code = ?",
						)
						.get("active"),
				);
			const now = new Date().toISOString();
			const result = this.insert({
				created_at: now,
				name,
				status_id: status.id,
				updated_at: now,
			});

			return schema.coerce
				.number()
				.int()
				.positive()
				.parse(result.lastInsertRowid);
		})();
	}

	archive(id: number) {
		return this.#setStatus(id, "archived");
	}

	unarchive(id: number) {
		return this.#setStatus(id, "active");
	}

	#setStatus(id: number, statusCode: "active" | "archived") {
		const result = this.db
			.prepare<[string, string, number]>(
				`UPDATE projects
				SET
					status_id = (
						SELECT id FROM project_statuses WHERE code = ?
					),
					updated_at = ?
				WHERE id = ?`,
			)
			.run(statusCode, new Date().toISOString(), id);

		return result.changes > 0 ? id : undefined;
	}
}
