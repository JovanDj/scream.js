import type { Database } from "@scream.js/database/db.js";
import {
	type ProjectShowInput,
	projectShowDataSchema,
} from "./project.schema.js";

export class GetProjectService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(input: ProjectShowInput) {
		const db = this.#db;
		const row = await db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.where({ "projects.id": input.id })
			.select(
				"projects.id",
				"projects.name",
				db.ref("project_statuses.code").as("status_code"),
			)
			.first();

		return row === undefined || row === null
			? undefined
			: projectShowDataSchema.parse(row);
	}
}
