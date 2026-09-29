import type { Database } from "@scream.js/database/db.js";
import { type TagShowInput, tagShowDataSchema } from "./tag.schema.js";

export class GetTagService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(input: TagShowInput) {
		const row = await this.#db("tags")
			.where({ id: input.id })
			.select("id", "name")
			.first();
		return row == null ? undefined : tagShowDataSchema.parse(row);
	}
}
