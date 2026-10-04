import type { Database } from "@scream.js/database/db.js";
import type { IndexInput } from "@scream.js/http/controllers/index.controller.js";
import {
	type ProjectNoteIndexInput,
	projectNoteIndexDataSchema,
} from "./project-note.schema.js";

export class ListProjectNotesService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(input: IndexInput<ProjectNoteIndexInput>) {
		const query = this.#db("project_notes")
			.join("projects", "project_notes.project_id", "projects.id")
			.select(
				"project_notes.id",
				"project_notes.project_id",
				"project_notes.title",
				"project_notes.body",
				"projects.name as project_name",
			);
		if (input.projectId !== undefined) {
			query.where({ "project_notes.project_id": input.projectId });
		}
		const rows = await query
			.orderBy("project_notes.id", "desc")
			.limit(input.limit)
			.offset(input.offset);
		return projectNoteIndexDataSchema.parse(rows);
	}
}
