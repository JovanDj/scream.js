import type { Database } from "@scream.js/database/db.js";
import { schema } from "@scream.js/validator/schema.js";

export type Project = {
	readonly id: number;
	readonly name: string;
	readonly statusCode: "active" | "archived";
};

export class ProjectsTable {
	readonly #db: Database;

	static create(db: Database) {
		return new ProjectsTable(db);
	}

	private constructor(db: Database) {
		this.#db = db;
	}

	async list(): Promise<readonly Project[]> {
		const rows = await this.#db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.select(
				"projects.id",
				"projects.name",
				this.#db.ref("project_statuses.code").as("status_code"),
			)
			.orderBy("projects.id", "desc");

		return schema
			.array(
				schema.object({
					id: schema.coerce.number().int().positive(),
					name: schema.string(),
					status_code: schema.enum(["active", "archived"]),
				}),
			)
			.transform((projects) =>
				projects.map((project) => ({
					id: project.id,
					name: project.name,
					statusCode: project.status_code,
				})),
			)
			.parse(rows);
	}

	async find(id: number): Promise<Project | undefined> {
		const row = await this.#db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.where({ "projects.id": id })
			.select(
				"projects.id",
				"projects.name",
				this.#db.ref("project_statuses.code").as("status_code"),
			)
			.first();

		if (!row) {
			return undefined;
		}

		return schema
			.object({
				id: schema.coerce.number().int().positive(),
				name: schema.string(),
				status_code: schema.enum(["active", "archived"]),
			})
			.transform((project) => ({
				id: project.id,
				name: project.name,
				statusCode: project.status_code,
			}))
			.parse(row);
	}

	async insert(name: string) {
		const statusRow = await this.#db("project_statuses")
			.where({ code: "active" })
			.first("id");
		const status = schema
			.object({ id: schema.coerce.number().positive() })
			.parse(statusRow);
		const now = new Date().toISOString();
		const [row] = await this.#db("projects")
			.insert({
				created_at: now,
				name,
				status_id: status.id,
				updated_at: now,
			})
			.returning(["id"]);

		return row.id as number;
	}

	async setStatus(id: number, statusCode: "active" | "archived") {
		const project = await this.#db("projects").where({ id }).first("id");
		if (!project) {
			return undefined;
		}

		const status = await this.#db("project_statuses")
			.where({ code: statusCode })
			.first("id");
		await this.#db("projects").where({ id }).update({
			status_id: status.id,
			updated_at: new Date().toISOString(),
		});

		return { id };
	}
}
