import type { Database } from "@scream.js/database/db.js";
import { schema } from "@scream.js/validator/schema.js";
import type {
	CommandHandler,
	CommandHandlerFactory,
} from "../command-handler.js";
import type { ProjectStoreInput } from "./project.schema.js";

export class CreateProjectService
	implements CommandHandler<ProjectStoreInput, number>
{
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(input: ProjectStoreInput) {
		const projectStatusRow = await this.#db("project_statuses")
			.where({ code: "active" })
			.first("id");
		const projectStatus = schema
			.object({ id: schema.coerce.number().positive() })
			.parse(projectStatusRow);
		const now = new Date().toISOString();
		const [row] = await this.#db("projects")
			.insert({
				created_at: now,
				name: input.name,
				status_id: projectStatus.id,
				updated_at: now,
			})
			.returning(["id"]);
		return schema.coerce.number().positive().parse(row.id);
	}
}

export class CreateProjectServiceFactory
	implements CommandHandlerFactory<ProjectStoreInput, number>
{
	create(tx: Database) {
		return new CreateProjectService(tx);
	}
}
