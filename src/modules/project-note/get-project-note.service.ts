import type { Database } from "@scream.js/database/db.js";
import {
	type ProjectNoteShowInput,
	projectNoteDataSchema,
} from "./project-note.schema.js";

export class GetProjectNoteService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute({ id }: ProjectNoteShowInput) {
		const row = await this.#db("project_notes")
			.join("projects", "project_notes.project_id", "projects.id")
			.where({ "project_notes.id": id })
			.select(
				"project_notes.id",
				"project_notes.project_id",
				"project_notes.title",
				"project_notes.body",
				"projects.name as project_name",
			)
			.first();
		return row ? projectNoteDataSchema.parse(row) : undefined;
	}
}
