import type { Database } from "@scream.js/database/db.js";
import { tagIndexDataSchema } from "./tag.schema.js";

export class ListAllTagsService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute() {
		const rows = await this.#db("tags")
			.select("tags.id", "tags.name", "tags.created_at", "tags.updated_at")
			.orderBy("tags.name", "asc")
			.orderBy("tags.id", "desc");
		return tagIndexDataSchema.parse(rows);
	}
}
