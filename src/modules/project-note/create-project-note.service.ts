import type {
	CommandHandler,
	CommandHandlerFactory,
} from "@scream.js/database/command-handler.js";
import type { Database } from "@scream.js/database/db.js";
import { schema } from "@scream.js/validator/schema.js";
import { ProjectNotFoundError } from "./project-not-found.error.js";
import type { ProjectNoteStoreInput } from "./project-note.schema.js";

export class CreateProjectNoteService
	implements CommandHandler<ProjectNoteStoreInput, number>
{
	readonly #db: Database;
	readonly #now: () => string;

	constructor(db: Database, now: () => string) {
		this.#db = db;
		this.#now = now;
	}

	async execute(input: ProjectNoteStoreInput) {
		const parentRow = await this.#db("projects")
			.where({ id: input.projectId })
			.first("id", "name");
		if (!parentRow) {
			throw new ProjectNotFoundError();
		}
		const parent = schema
			.object({
				id: schema.coerce.number().int().positive(),
				name: schema.string(),
			})
			.parse(parentRow);
		const now = this.#now();
		const [row] = await this.#db("project_notes")
			.insert({
				body: input.body,
				created_at: now,
				project_id: parent.id,
				title: input.title,
				updated_at: now,
			})
			.returning("id");
		return schema
			.object({ id: schema.coerce.number().int().positive() })
			.parse(row).id;
	}
}

export class CreateProjectNoteServiceFactory
	implements CommandHandlerFactory<ProjectNoteStoreInput, number>
{
	readonly #now: () => string;

	constructor(now: () => string) {
		this.#now = now;
	}

	create(tx: Database) {
		return new CreateProjectNoteService(tx, this.#now);
	}
}
