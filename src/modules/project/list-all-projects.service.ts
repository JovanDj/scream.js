import type { Database } from "@scream.js/database/db.js";
import { schema } from "@scream.js/validator/schema.js";

export class ListAllProjectsService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute() {
		const rows = await this.#db("projects")
			.select("id", "name")
			.orderBy("name", "asc")
			.orderBy("id", "asc");
		return schema
			.array(
				schema.object({
					id: schema.coerce.number().int().positive(),
					name: schema.string(),
				}),
			)
			.parse(rows);
	}
}
