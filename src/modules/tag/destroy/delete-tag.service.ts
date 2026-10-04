import type { Database } from "@scream.js/database/db.js";
import type { TagShowInput } from "../tag.schema.js";

export class DeleteTagService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(input: TagShowInput) {
		return (await this.#db("tags").where({ id: input.id }).del()) > 0;
	}
}
