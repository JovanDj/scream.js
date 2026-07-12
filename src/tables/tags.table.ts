import type { Database } from "@scream.js/database/db.js";
import { schema } from "@scream.js/validator/schema.js";

export class TagsTable {
	readonly #db: Database;

	static create(db: Database) {
		return new TagsTable(db);
	}

	private constructor(db: Database) {
		this.#db = db;
	}

	async list() {
		const rows = await this.#db("tags")
			.select("tags.id", "tags.name")
			.orderBy("tags.name", "asc");

		return schema
			.array(
				schema.object({
					id: schema.coerce.number().int().positive(),
					name: schema.string(),
				}),
			)
			.parse(rows);
	}

	async findByIds(ids: readonly number[]) {
		const rows = await this.#db("tags").whereIn("id", ids).select("id", "name");

		return schema
			.array(
				schema.object({
					id: schema.coerce.number().int().positive(),
					name: schema.string(),
				}),
			)
			.parse(rows);
	}

	async insert(name: string) {
		const now = new Date().toISOString();
		await this.#db("tags").insert({
			created_at: now,
			name,
			updated_at: now,
		});
	}

	async delete(id: number) {
		return (await this.#db("tags").where({ id }).del()) > 0;
	}
}
