import type {
	CommandHandler,
	CommandHandlerFactory,
} from "@scream.js/database/command-handler.js";
import type { Database } from "@scream.js/database/db.js";
import type { TagStoreInput } from "../tag.schema.js";

export class CreateTagService implements CommandHandler<TagStoreInput> {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(input: TagStoreInput) {
		const now = new Date().toISOString();
		await this.#db("tags").insert({
			created_at: now,
			name: input.name,
			updated_at: now,
		});
	}
}

export class CreateTagServiceFactory
	implements CommandHandlerFactory<TagStoreInput>
{
	create(tx: Database) {
		return new CreateTagService(tx);
	}
}
