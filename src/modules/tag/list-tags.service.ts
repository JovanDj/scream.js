import type { Database } from "@scream.js/database/db.js";
import { type TagIndexInput, tagIndexDataSchema } from "./tag.schema.js";

export class ListTagsService {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(
		input: TagIndexInput & { readonly limit: number; readonly offset: number },
	) {
		const query = this.#db("tags").select(
			"tags.id",
			"tags.name",
			"tags.created_at",
			"tags.updated_at",
		);
		query.orderBy(this.#sortColumn(input.sort), input.direction);
		if (input.sort !== "created") {
			query.orderBy("tags.id", "desc");
		}

		const rows = await query.limit(input.limit).offset(input.offset);
		return tagIndexDataSchema.parse(rows);
	}

	#sortColumn(sort: TagIndexInput["sort"]) {
		switch (sort) {
			case "created":
				return "tags.id";
			case "name":
				return "tags.name";
		}
	}
}
