import type { Database } from "@scream.js/database/db.js";
import type { ProjectNoteShowInput } from "../project-note.schema.js";

export class DeleteProjectNoteService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute({ id }: ProjectNoteShowInput) {
		return (await this.#db("project_notes").where({ id }).del()) > 0;
	}
}
