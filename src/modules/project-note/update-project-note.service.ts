import type {
	CommandHandler,
	CommandHandlerFactory,
} from "@scream.js/database/command-handler.js";
import type { Database } from "@scream.js/database/db.js";
import {
	type ProjectNoteShowInput,
	type ProjectNoteUpdateInput,
	projectNoteDataSchema,
} from "./project-note.schema.js";

export type UpdateProjectNote = ProjectNoteShowInput & ProjectNoteUpdateInput;

export class UpdateProjectNoteService
	implements CommandHandler<UpdateProjectNote, { id: number } | undefined>
{
	readonly #db: Database;
	readonly #now: () => string;

	constructor(db: Database, now: () => string) {
		this.#db = db;
		this.#now = now;
	}

	async execute(input: UpdateProjectNote) {
		const row = await this.#db("project_notes")
			.join("projects", "project_notes.project_id", "projects.id")
			.where({ "project_notes.id": input.id })
			.select(
				"project_notes.id",
				"project_notes.project_id",
				"project_notes.title",
				"project_notes.body",
				"projects.name as project_name",
			)
			.first();
		if (!row) {
			return undefined;
		}
		const current = projectNoteDataSchema.parse(row);
		await this.#db("project_notes").where({ id: current.id }).update({
			body: input.body,
			title: input.title,
			updated_at: this.#now(),
		});
		return { id: current.id };
	}
}

export class UpdateProjectNoteServiceFactory
	implements
		CommandHandlerFactory<UpdateProjectNote, { id: number } | undefined>
{
	readonly #now: () => string;

	constructor(now: () => string) {
		this.#now = now;
	}

	create(tx: Database) {
		return new UpdateProjectNoteService(tx, this.#now);
	}
}
