import type { Database, DatabaseHandle } from "@scream.js/database/db.js";
import { Tag, type TagWriteInput } from "./tag.js";
import { tagRowValidator } from "./tag.schema.js";

export class TagMapper {
	readonly #db: DatabaseHandle;

	constructor(db: DatabaseHandle) {
		this.#db = db;
	}

	static create(db: Database) {
		return new TagMapper(db);
	}

	async delete(id: number) {
		const affectedRows = await this.#db("tags").where({ id }).del();
		return affectedRows > 0;
	}

	async findAll() {
		const rows = await this.#baseQuery().orderBy("tags.name", "asc");
		return rows.map((row) => this.#toTag(row));
	}

	async findTodoTagIds(todoId: number) {
		const todo = await this.#db("todos").where({ id: todoId }).first("id");
		if (!todo) {
			return undefined;
		}

		const rows = await this.#db("todo_tags")
			.where({ todo_id: todoId })
			.orderBy("tag_id", "asc")
			.select("tag_id");

		return rows.map((row) => Number(row["tag_id"]));
	}

	async insert(input: Readonly<TagWriteInput>) {
		const now = new Date().toISOString();
		const [row] = await this.#db("tags")
			.insert(this.#toTagInsertRecord(input, now))
			.returning(["id"]);

		const created = await this.#baseQuery()
			.where({ "tags.id": Number(row["id"]) })
			.first();

		if (!created) {
			throw new Error("Tag creation failed");
		}

		return this.#toTag(created);
	}

	async replaceTodoTags(todoId: number, input: Readonly<{ tagIds: number[] }>) {
		const todo = await this.#db("todos").where({ id: todoId }).first("id");
		if (!todo) {
			return false;
		}

		const uniqueTagIds = [...new Set(input.tagIds)];
		if (uniqueTagIds.length > 0) {
			const matchedTags = await this.#db("tags")
				.whereIn("id", uniqueTagIds)
				.select("id");

			if (matchedTags.length !== uniqueTagIds.length) {
				return false;
			}
		}

		await this.#db("todo_tags").where({ todo_id: todoId }).del();

		if (uniqueTagIds.length === 0) {
			return true;
		}

		await this.#db("todo_tags").insert(
			uniqueTagIds.map((tagId) => ({
				created_at: new Date().toISOString(),
				tag_id: tagId,
				todo_id: todoId,
			})),
		);

		return true;
	}

	#baseQuery() {
		return this.#db("tags").select(
			"tags.id",
			"tags.name",
			"tags.created_at",
			"tags.updated_at",
		);
	}

	#toTag(row: unknown) {
		const parsed = tagRowValidator.validate(row);
		if (!parsed.success) {
			throw new Error("Invalid tag row");
		}

		return new Tag({
			createdAt: parsed.data.created_at,
			id: parsed.data.id,
			name: parsed.data.name,
		});
	}

	#toTagInsertRecord(input: Readonly<TagWriteInput>, now: string) {
		return {
			created_at: now,
			name: input.name,
			updated_at: now,
		};
	}
}
