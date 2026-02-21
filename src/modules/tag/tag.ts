import type { Knex } from "knex";
import { z } from "zod/v4";

const tagRowSchema = z.object({
	created_at: z.string(),
	id: z.coerce.number(),
	name: z.string(),
	updated_at: z.string().optional(),
});

const baseTagQuery = (db: Knex | Knex.Transaction) =>
	db("tags").select(
		"tags.id",
		"tags.name",
		"tags.created_at",
		"tags.updated_at",
	);

export class Tag {
	readonly #id: number;
	readonly #name: string;
	readonly #createdAt: string;

	constructor(snapshot: {
		id: number;
		name: string;
		createdAt: string;
	}) {
		this.#id = snapshot.id;
		this.#name = snapshot.name;
		this.#createdAt = snapshot.createdAt;
	}

	get id() {
		return this.#id;
	}

	get name() {
		return this.#name;
	}

	get createdAt() {
		return this.#createdAt;
	}

	static async create(
		db: Knex | Knex.Transaction,
		input: Readonly<{ name: string }>,
	) {
		const now = new Date().toISOString();
		const [row] = await db("tags")
			.insert({
				created_at: now,
				name: input.name,
				updated_at: now,
			})
			.returning(["id"]);

		const created = await baseTagQuery(db)
			.where({ "tags.id": Number(row["id"]) })
			.first();
		if (!created) {
			throw new Error("Tag creation failed");
		}

		return Tag.#fromRow(created);
	}

	static async findAll(db: Knex | Knex.Transaction) {
		const rows = await baseTagQuery(db).orderBy("tags.name", "asc");

		return rows.map((row) => Tag.#fromRow(row));
	}

	static async deleteById(db: Knex | Knex.Transaction, id: number) {
		const affectedRows = await db("tags").where({ id }).del();
		return affectedRows > 0;
	}

	static async findTodoTagIds(db: Knex | Knex.Transaction, todoId: number) {
		const todo = await db("todos").where({ id: todoId }).first("id");
		if (!todo) {
			return undefined;
		}

		const rows = await db("todo_tags")
			.where({ todo_id: todoId })
			.orderBy("tag_id", "asc")
			.select("tag_id");

		return rows.map((row) => Number(row["tag_id"]));
	}

	static async replaceTodoTags(
		db: Knex | Knex.Transaction,
		input: Readonly<{ tagIds: number[]; todoId: number }>,
	) {
		const todo = await db("todos").where({ id: input.todoId }).first("id");

		if (!todo) {
			return false;
		}

		const uniqueTagIds = [...new Set(input.tagIds)];

		if (uniqueTagIds.length > 0) {
			const matchedTags = await db("tags")
				.whereIn("id", uniqueTagIds)
				.select("id");

			if (matchedTags.length !== uniqueTagIds.length) {
				return false;
			}
		}

		await db("todo_tags").where({ todo_id: input.todoId }).del();

		if (uniqueTagIds.length === 0) {
			return true;
		}

		await db("todo_tags").insert(
			uniqueTagIds.map((tagId) => ({
				created_at: new Date().toISOString(),
				tag_id: tagId,
				todo_id: input.todoId,
			})),
		);

		return true;
	}

	static #fromRow(row: unknown) {
		const parsed = tagRowSchema.parse(row);
		return new Tag({
			createdAt: parsed.created_at,
			id: parsed.id,
			name: parsed.name,
		});
	}
}
