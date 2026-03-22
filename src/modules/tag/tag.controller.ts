import type { DatabaseHandle } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import { createValidator } from "@scream.js/validator/create-validator.js";
import { schema } from "@scream.js/validator/schema.js";

const tagIdValidator = createValidator(schema.coerce.number().int().positive());

const tagWriteValidator = createValidator(
	schema.strictObject({
		name: schema
			.string()
			.default("")
			.transform((value) => value.trim())
			.refine((value) => value.length > 0, {
				message: "Required",
			}),
	}),
);

const replaceTodoTagsValidator = createValidator(
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

export class TagController {
	readonly #db: DatabaseHandle;

	constructor(db: DatabaseHandle) {
		this.#db = db;
	}

	async index(ctx: HttpContext) {
		const rows = await this.#db("tags")
			.select("tags.id", "tags.name", "tags.created_at", "tags.updated_at")
			.orderBy("tags.name", "asc");

		const tags = schema
			.array(
				schema.object({
					id: schema.coerce.number(),
					name: schema.string(),
				}),
			)
			.parse(rows)
			.map((parsed) => {
				return {
					id: parsed.id,
					name: parsed.name,
				};
			});
		return ctx.render("tag-index", {
			pageTitle: "Tags",
			tags,
		});
	}

	async store(ctx: HttpContext) {
		const parsed = ctx.body(tagWriteValidator);
		if (!parsed.success) {
			ctx.unprocessableEntity();
			const rows = await this.#db("tags")
				.select("tags.id", "tags.name", "tags.created_at", "tags.updated_at")
				.orderBy("tags.name", "asc");
			const tags = schema
				.array(
					schema.object({
						id: schema.coerce.number(),
						name: schema.string(),
					}),
				)
				.parse(rows)
				.map((parsedTag) => {
					return {
						id: parsedTag.id,
						name: parsedTag.name,
					};
				});
			return ctx.render("tag-index", {
				errors: parsed.errors,
				pageTitle: "Tags",
				tags,
			});
		}

		try {
			await this.#db.transaction(async (tx) => {
				const now = new Date().toISOString();
				await tx("tags").insert({
					created_at: now,
					name: parsed.data.name,
					updated_at: now,
				});
			});
			return ctx.redirect("/tags");
		} catch {
			ctx.unprocessableEntity();
			const rows = await this.#db("tags")
				.select("tags.id", "tags.name", "tags.created_at", "tags.updated_at")
				.orderBy("tags.name", "asc");
			const tags = schema
				.array(
					schema.object({
						id: schema.coerce.number(),
						name: schema.string(),
					}),
				)
				.parse(rows)
				.map((parsedTag) => {
					return {
						id: parsedTag.id,
						name: parsedTag.name,
					};
				});
			return ctx.render("tag-index", {
				errors: { name: ["Tag name must be unique"] },
				pageTitle: "Tags",
				tags,
			});
		}
	}

	async delete(ctx: HttpContext) {
		const tagId = ctx.param("id", tagIdValidator);
		if (!tagId) {
			return ctx.notFound();
		}

		const affectedRows = await this.#db("tags").where({ id: tagId }).del();
		const deleted = affectedRows > 0;
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/tags");
	}

	async assignToTodo(ctx: HttpContext) {
		const todoId = ctx.param("id", tagIdValidator);
		if (!todoId) {
			return ctx.notFound();
		}

		const parsed = ctx.body(replaceTodoTagsValidator);
		if (!parsed.success) {
			ctx.unprocessableEntity();
			return ctx.redirect(`/todos/${todoId}/edit`);
		}

		const replaced = await this.#db.transaction(async (tx) => {
			const todo = await tx("todos").where({ id: todoId }).first("id");
			if (!todo) {
				return false;
			}

			const uniqueTagIds = [...new Set(parsed.data.tagIds)];
			if (uniqueTagIds.length > 0) {
				const matchedTags = await tx("tags")
					.whereIn("id", uniqueTagIds)
					.select("id");
				if (matchedTags.length !== uniqueTagIds.length) {
					return false;
				}
			}

			await tx("todo_tags").where({ todo_id: todoId }).del();

			if (uniqueTagIds.length === 0) {
				return true;
			}

			await tx("todo_tags").insert(
				uniqueTagIds.map((tagId) => ({
					created_at: new Date().toISOString(),
					tag_id: tagId,
					todo_id: todoId,
				})),
			);

			return true;
		});

		if (!replaced) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todoId}/edit`);
	}
}
