import type { Database, DatabaseHandle } from "@scream.js/database/db.js";
import type { Project, ProjectWriteInput } from "./project.js";
import {
	toProject,
	toProjectInsertRecord,
	toProjectUpdateRecord,
} from "./project.mapper.js";
import { projectRowValidator } from "./project.schema.js";
import type { ProjectRepository } from "./project.service.js";

export class KnexProjectRepository implements ProjectRepository {
	readonly #db: DatabaseHandle;

	constructor(db: DatabaseHandle) {
		this.#db = db;
	}

	static create(db: Database) {
		return new KnexProjectRepository(db);
	}

	async delete(id: number) {
		const affectedRows = await this.#db("projects").where({ id }).del();
		return affectedRows > 0;
	}

	async findAll(options?: Readonly<{ includeArchived?: boolean }>) {
		const query = this.#baseQuery();
		if (!options?.includeArchived) {
			query.where({ "project_statuses.code": "active" });
		}

		const rows = await query.orderBy("projects.id", "desc");
		return rows.map((row) => this.#toProject(row));
	}

	async findById(id: number) {
		const row = await this.#baseQuery().where({ "projects.id": id }).first();
		if (!row) {
			return undefined;
		}

		return this.#toProject(row);
	}

	async insert(input: Readonly<ProjectWriteInput>) {
		const now = new Date().toISOString();
		const activeStatusId = await this.#findStatusId("active");
		const [row] = await this.#db("projects")
			.insert(toProjectInsertRecord(input, now, activeStatusId))
			.returning(["id"]);

		const created = await this.findById(Number(row["id"]));
		if (!created) {
			throw new Error("Project creation failed");
		}

		return created;
	}

	async save(project: Project) {
		const statusId = await this.#findStatusId(project.statusCode);
		const affectedRows = await this.#db("projects")
			.where({ id: project.id })
			.update(toProjectUpdateRecord(project, statusId));

		if (affectedRows === 0) {
			return undefined;
		}

		return project;
	}

	async transaction<T>(
		callback: (repository: ProjectRepository) => Promise<T>,
	): Promise<T> {
		if ("transaction" in this.#db) {
			return this.#db.transaction(async (tx) => {
				return callback(new KnexProjectRepository(tx));
			});
		}

		return callback(this);
	}

	async #findStatusId(code: Project["statusCode"]) {
		const row = await this.#db("project_statuses").where({ code }).first("id");
		if (!row) {
			throw new Error(`Project status lookup not found: ${code}`);
		}

		return Number(row["id"]);
	}

	#baseQuery() {
		return this.#db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.select(
				"projects.id",
				"projects.name",
				"projects.created_at",
				"projects.updated_at",
				this.#db.ref("project_statuses.code").as("status_code"),
			);
	}

	#toProject(row: unknown) {
		const parsed = projectRowValidator.validate(row);
		if (!parsed.success) {
			throw new Error("Invalid project row");
		}

		return toProject(parsed.data);
	}
}
