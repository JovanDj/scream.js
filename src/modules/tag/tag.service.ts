import type { Database } from "@scream.js/database/db.js";
import { createValidator } from "@scream.js/validator/create-validator.js";
import { schema } from "@scream.js/validator/schema.js";

export type TagRecord = {
	id: number;
	name: string;
};

export class TagService {
	readonly #db: Database;

	static #idValue = schema.coerce.number().int().positive();
	static #nameValue = schema
		.string()
		.default("")
		.transform((value) => value.trim())
		.refine((value) => value.length > 0, {
			message: "Required",
		});
	static #idRowSchema = schema.object({
		id: TagService.#idValue,
	});
	static #tagRowSchema = schema.object({
		id: TagService.#idValue,
		name: schema.string(),
	});
	static #tagRecordSchema = TagService.#tagRowSchema.transform((row) => ({
		id: row.id,
		name: row.name,
	}));

	static idParamValidator() {
		return createValidator(TagService.#idValue);
	}

	static writeBodyValidator() {
		return createValidator(
			schema.strictObject({
				name: TagService.#nameValue,
			}),
		);
	}

	static replaceTodoTagsBodyValidator() {
		return createValidator(
			schema.strictObject({
				tagIds: schema.preprocess((value) => {
					if (!value) {
						return [];
					}
					if (Array.isArray(value)) {
						return value;
					}
					return [value];
				}, schema.array(schema.coerce.number().int().positive()).default([])),
			}),
		);
	}

	static parseTagRows(rows: unknown): TagRecord[] {
		return TagService.#tagRecordSchema.array().parse(rows);
	}

	static parseLookupIdRow(row: unknown) {
		return TagService.#idRowSchema.parse(row);
	}

	static parseLookupIdRows(rows: unknown) {
		return TagService.#idRowSchema
			.array()
			.parse(rows)
			.map((row) => row.id);
	}

	constructor(db: Database) {
		this.#db = db;
	}

	async index() {
		const rows = await this.#db("tags")
			.select("tags.id", "tags.name", "tags.created_at", "tags.updated_at")
			.orderBy("tags.name", "asc");
		return TagService.parseTagRows(rows);
	}

	async listForRender() {
		return this.index();
	}

	async create(name: string) {
		return this.#db.transaction(async (tx) => {
			const now = new Date().toISOString();
			await tx("tags").insert({
				created_at: now,
				name,
				updated_at: now,
			});
		});
	}

	async delete(id: number) {
		const affectedRows = await this.#db("tags").where({ id }).del();
		return affectedRows > 0;
	}

	async assignToTodo(input: { tagIds: number[]; todoId: number }) {
		return this.#db.transaction(async (tx) => {
			const todo = await tx("todos").where({ id: input.todoId }).first("id");
			if (!todo) {
				return false;
			}

			if (input.tagIds.length > 0) {
				const matchedTags = await tx("tags")
					.whereIn("id", input.tagIds)
					.select("id");
				const matchedTagIds = TagService.parseLookupIdRows(matchedTags);
				if (matchedTagIds.length !== input.tagIds.length) {
					return false;
				}
			}

			await tx("todo_tags").where({ todo_id: input.todoId }).del();
			if (input.tagIds.length > 0) {
				await tx("todo_tags").insert(
					input.tagIds.map((tagId) => ({
						created_at: new Date().toISOString(),
						tag_id: tagId,
						todo_id: input.todoId,
					})),
				);
			}

			const affectedRows = await tx("todos")
				.where({ id: input.todoId })
				.update({
					updated_at: new Date().toISOString(),
				});

			return affectedRows > 0;
		});
	}
}
