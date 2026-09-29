import type { Database } from "@scream.js/database/db.js";
import { schema } from "@scream.js/validator/schema.js";
import type {
	CommandHandler,
	CommandHandlerFactory,
} from "../command-handler.js";
import type { ProjectShowInput } from "./project.schema.js";

export class ArchiveProjectService
	implements CommandHandler<ProjectShowInput, boolean>
{
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute({ id }: ProjectShowInput) {
		const existing = await this.#db("projects").where({ id }).first("id");
		if (!existing) {
			return false;
		}

		const statusRow = await this.#db("project_statuses")
			.where({ code: "archived" })
			.first("id");
		const status = schema
			.object({ id: schema.coerce.number().positive() })
			.parse(statusRow);
		await this.#db("projects").where({ id }).update({
			status_id: status.id,
			updated_at: new Date().toISOString(),
		});
		return true;
	}
}

export class ArchiveProjectServiceFactory
	implements CommandHandlerFactory<ProjectShowInput, boolean>
{
	create(tx: Database) {
		return new ArchiveProjectService(tx);
	}
}
