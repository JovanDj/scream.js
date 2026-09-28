import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Action } from "../action.js";
import {
	tagAssignmentInputSchema,
	tagAssignmentTodoSchema,
} from "./tag.schema.js";

export class TagAssignAction implements Action {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async handle(ctx: HttpContext) {
		const parsedTodoId = tagAssignmentTodoSchema.safeParse({
			id: ctx.param("id"),
		});
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}
		const todoId = parsedTodoId.data.id;

		const parsed = tagAssignmentInputSchema.safeParse(ctx.body());
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
