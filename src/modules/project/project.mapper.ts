import type { Database, DatabaseHandle } from "@scream.js/database/db.js";
import { Project, type ProjectWriteInput } from "./project.js";
import { projectRowValidator } from "./project.schema.js";

export class ProjectMapper {
	readonly #db: DatabaseHandle;

	constructor(db: DatabaseHandle) {
		this.#db = db;
	}

	static create(db: Database) {
		return new ProjectMapper(db);
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
			.insert(this.#toProjectInsertRecord(input, now, activeStatusId))
			.returning(["id"]);

		const created = await this.findById(Number(row["id"]));
		if (!created) {
			throw new Error("Project creation failed");
		}

		return created;
	}

	async update(project: Project) {
		const statusId = await this.#findStatusId(project.statusCode);
		const affectedRows = await this.#db("projects")
			.where({ id: project.id })
			.update(this.#toProjectUpdateRecord(project, statusId));

		if (affectedRows === 0) {
			return undefined;
		}

		return this.findById(project.id);
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

	async #findStatusId(code: Project["statusCode"]) {
		const row = await this.#db("project_statuses").where({ code }).first("id");
		if (!row) {
			throw new Error(`Project status lookup not found: ${code}`);
		}

		return Number(row["id"]);
	}

	#toProject(row: unknown) {
		const parsed = projectRowValidator.validate(row);
		if (!parsed.success) {
			throw new Error("Invalid project row");
		}

		return new Project({
			createdAt: parsed.data.created_at,
			id: parsed.data.id,
			name: parsed.data.name,
			statusCode: parsed.data.status_code,
			updatedAt: parsed.data.updated_at,
		});
	}

	#toProjectInsertRecord(
		input: Readonly<ProjectWriteInput>,
		now: string,
		statusId: number,
	) {
		return {
			created_at: now,
			name: input.name,
			status_id: statusId,
			updated_at: now,
		};
	}

	#toProjectUpdateRecord(project: Project, statusId: number) {
		return {
			name: project.name,
			status_id: statusId,
			updated_at: project.updatedAt,
		};
	}
}
