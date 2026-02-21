import type { Knex } from "knex";
import { z } from "zod/v4";

export class Project {
	readonly #id: number;
	readonly #name: string;
	readonly #statusCode: string;
	readonly #createdAt: string;
	readonly #updatedAt: string;

	get id() {
		return this.#id;
	}

	get name() {
		return this.#name;
	}

	get statusCode() {
		return this.#statusCode;
	}

	get createdAt() {
		return this.#createdAt;
	}

	get updatedAt() {
		return this.#updatedAt;
	}

	constructor(snapshot: {
		id: number;
		name: string;
		statusCode: string;
		createdAt: string;
		updatedAt: string;
	}) {
		this.#id = snapshot.id;
		this.#name = snapshot.name;
		this.#statusCode = snapshot.statusCode;
		this.#createdAt = snapshot.createdAt;
		this.#updatedAt = snapshot.updatedAt;
	}

	static readonly #projectRowSchema = z.object({
		created_at: z.string(),
		id: z.coerce.number(),
		name: z.string(),
		status_code: z.string(),
		updated_at: z.string(),
	});

	static async #findProjectStatusId(db: Knex | Knex.Transaction, code: string) {
		const row = await db("project_statuses").where({ code }).first("id");
		if (!row) {
			throw new Error(`Project status lookup not found: ${code}`);
		}

		return Number(row["id"]);
	}

	static #baseProjectQuery(db: Knex | Knex.Transaction) {
		return db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.select(
				"projects.id",
				"projects.name",
				"projects.created_at",
				"projects.updated_at",
				db.ref("project_statuses.code").as("status_code"),
			);
	}

	apply(input: Readonly<{ name: string }>) {
		return new Project({
			createdAt: this.#createdAt,
			id: this.#id,
			name: input.name,
			statusCode: this.#statusCode,
			updatedAt: new Date().toISOString(),
		});
	}

	setStatus(statusCode: string) {
		return new Project({
			createdAt: this.#createdAt,
			id: this.#id,
			name: this.#name,
			statusCode,
			updatedAt: new Date().toISOString(),
		});
	}

	async save(db: Knex | Knex.Transaction) {
		const statusId = await Project.#findProjectStatusId(db, this.statusCode);

		const affectedRows = await db("projects").where({ id: this.id }).update({
			name: this.name,
			status_id: statusId,
			updated_at: this.updatedAt,
		});

		if (affectedRows === 0) {
			throw new Error("Project update failed");
		}

		return this;
	}

	static async create(
		db: Knex | Knex.Transaction,
		input: Readonly<{ name: string }>,
	) {
		const now = new Date().toISOString();
		const activeStatusId = await Project.#findProjectStatusId(db, "active");
		const [row] = await db("projects")
			.insert({
				created_at: now,
				name: input.name,
				status_id: activeStatusId,
				updated_at: now,
			})
			.returning(["id"]);

		const created = await Project.findById(db, Number(row["id"]));
		if (!created) {
			throw new Error("Project creation failed");
		}

		return created;
	}

	static async findById(
		db: Knex | Knex.Transaction,
		id: number,
	): Promise<Project | undefined> {
		const row = await Project.#baseProjectQuery(db)
			.where({ "projects.id": id })
			.first();
		if (!row) {
			return undefined;
		}

		return Project.#fromRow(row);
	}

	static async findAll(
		db: Knex | Knex.Transaction,
		options?: { includeArchived?: boolean },
	) {
		const query = Project.#baseProjectQuery(db);
		if (!options?.includeArchived) {
			query.where({ "project_statuses.code": "active" });
		}

		const rows = await query.orderBy("projects.id", "desc");
		return rows.map((row) => Project.#fromRow(row));
	}

	static async deleteById(db: Knex | Knex.Transaction, id: number) {
		const affectedRows = await db("projects").where({ id }).del();
		return affectedRows > 0;
	}

	static #fromRow(row: unknown) {
		const parsed = Project.#projectRowSchema.parse(row);
		return new Project({
			createdAt: parsed.created_at,
			id: parsed.id,
			name: parsed.name,
			statusCode: parsed.status_code,
			updatedAt: parsed.updated_at,
		});
	}
}
