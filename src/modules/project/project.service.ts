import type { Database } from "@scream.js/database/db.js";
import { createValidator } from "@scream.js/validator/create-validator.js";
import { schema } from "@scream.js/validator/schema.js";

export type ProjectRecord = {
	id: number;
	name: string;
	statusCode: "active" | "archived";
};

export class ProjectService {
	static #idValue = schema.coerce.number().int().positive();
	static #nameValue = schema
		.string()
		.default("")
		.transform((value) => value.trim())
		.refine((value) => value.length > 0, {
			message: "Required",
		});
	static #statusCodeValue = schema.enum(["active", "archived"]);
	static #idRowSchema = schema.object({
		id: ProjectService.#idValue,
	});
	static #projectRowSchema = schema.object({
		id: ProjectService.#idValue,
		name: schema.string(),
		status_code: ProjectService.#statusCodeValue,
	});
	static #projectRecordSchema = ProjectService.#projectRowSchema.transform(
		(row) => ({
			id: row.id,
			name: row.name,
			statusCode: row.status_code,
		}),
	);

	static idParamValidator() {
		return createValidator(ProjectService.#idValue);
	}

	static writeBodyValidator() {
		return createValidator(
			schema.strictObject({
				name: ProjectService.#nameValue,
			}),
		);
	}

	static parseProjectIdRow(row: unknown) {
		return ProjectService.#idRowSchema.parse(row);
	}

	static parseProjectRow(row: unknown): ProjectRecord {
		return ProjectService.#projectRecordSchema.parse(row);
	}

	static parseProjectRows(row: unknown): ProjectRecord[] {
		return ProjectService.#projectRecordSchema.array().parse(row);
	}

	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async index() {
		const rows = await this.#db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.select(
				"projects.id",
				"projects.name",
				this.#db.ref("project_statuses.code").as("status_code"),
			)
			.orderBy("projects.id", "desc");

		return ProjectService.parseProjectRows(rows);
	}

	async findById(id: number) {
		const row = await this.#db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.where({ "projects.id": id })
			.select(
				"projects.id",
				"projects.name",
				this.#db.ref("project_statuses.code").as("status_code"),
			)
			.first();

		return row ? ProjectService.parseProjectRow(row) : undefined;
	}

	async create(name: string) {
		return this.#db.transaction(async (tx) => {
			const projectStatusRow = await tx("project_statuses")
				.where({ code: "active" })
				.first("id");

			if (!projectStatusRow) {
				throw new Error("Project status lookup not found: active");
			}

			const projectStatus = schema
				.object({
					id: schema.coerce.number().positive(),
				})
				.parse(projectStatusRow);

			const now = new Date().toISOString();
			const [row] = await tx("projects")
				.insert({
					created_at: now,
					name,
					status_id: projectStatus.id,
					updated_at: now,
				})
				.returning(["id"]);

			return ProjectService.parseProjectIdRow(row).id;
		});
	}

	async update(input: { id: number; name: string }) {
		return this.#updateProject(input.id, async (tx) => {
			return tx("projects").where({ id: input.id }).update({
				name: input.name,
				updated_at: new Date().toISOString(),
			});
		});
	}

	async archive(input: { id: number }) {
		return this.#setStatus(input.id, "archived");
	}

	async unarchive(input: { id: number }) {
		return this.#setStatus(input.id, "active");
	}

	async delete(id: number) {
		const affectedRows = await this.#db("projects").where({ id }).del();
		return affectedRows > 0;
	}

	async #setStatus(id: number, code: "active" | "archived") {
		return this.#updateProject(id, async (tx) => {
			const statusRow = await tx("project_statuses")
				.where({ code })
				.first("id");
			if (!statusRow) {
				throw new Error(`Project status lookup not found: ${code}`);
			}

			const status = schema
				.object({
					id: schema.coerce.number().positive(),
				})
				.parse(statusRow);

			return tx("projects").where({ id }).update({
				status_id: status.id,
				updated_at: new Date().toISOString(),
			});
		});
	}

	async #updateProject(id: number, update: (tx: Database) => Promise<number>) {
		return this.#db.transaction(async (tx) => {
			const existing = await tx("projects").where({ id }).first("id");
			if (!existing) {
				return;
			}

			const current = ProjectService.parseProjectIdRow(existing);
			const affectedRows = await update(tx);
			if (affectedRows === 0) {
				return undefined;
			}

			return { id: current.id };
		});
	}
}
