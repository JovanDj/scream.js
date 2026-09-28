import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import { schema } from "@scream.js/validator/schema.js";

export class TagController {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async destroy(ctx: HttpContext) {
		const parsedTagId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedTagId.success) {
			return ctx.notFound();
		}
		const tagId = parsedTagId.data;

		const deleted = (await this.#db("tags").where({ id: tagId }).del()) > 0;
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/tags");
	}

	async assignToTodo(ctx: HttpContext) {
		const parsedTodoId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));

		if (!parsedTodoId.success) {
			return ctx.notFound();
		}
		const todoId = parsedTodoId.data;

		const parsed = schema
			.strictObject({
				tagIds: schema.preprocess((value) => {
					if (!value) {
						return [];
					}
					if (Array.isArray(value)) {
						return value;
					}
					return [value];
				}, schema.array(schema.coerce.number().int().positive()).default([])),
			})
			.safeParse(ctx.body());
		if (!parsed.success) {
			return ctx.redirect(`/todos/${todoId}/edit`);
		}

		const replaced = await this.#db.transaction(async (tx) => {
			const tagIds = this.#uniqueTagIds(parsed.data.tagIds);
			const todo = await tx("todos").where({ id: todoId }).first("id");
			if (!todo) {
				return false;
			}

			if (tagIds.length > 0) {
				const matchedTags = await tx("tags").whereIn("id", tagIds).select("id");
				const matchedTagIds = matchedTags.map((row) => row.id);
				if (matchedTagIds.length !== tagIds.length) {
					return false;
				}
			}

			await tx("todo_tags").where({ todo_id: todoId }).del();
			if (tagIds.length > 0) {
				await tx("todo_tags").insert(
					tagIds.map((tagId) => ({
						created_at: new Date().toISOString(),
						tag_id: tagId,
						todo_id: todoId,
					})),
				);
			}

			const affectedRows = await tx("todos").where({ id: todoId }).update({
				updated_at: new Date().toISOString(),
			});

			return affectedRows > 0;
		});

		if (!replaced) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todoId}/edit`);
	}

	#uniqueTagIds(tagIds: readonly number[]) {
		return tagIds.filter((tagId, index) => tagIds.indexOf(tagId) === index);
	}
}
