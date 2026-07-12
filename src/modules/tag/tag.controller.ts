import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import { schema } from "@scream.js/validator/schema.js";
import { TagsTable } from "../../tables/tags.table.js";
import { TodoTagsTable } from "../../tables/todo-tags.table.js";
import { TodosTable } from "../../tables/todos.table.js";

const tagErrors = (
	issues: readonly { message: string; path: PropertyKey[] }[],
) => {
	const errors: { name?: string } = {};

	for (const issue of issues) {
		if (issue.path.join(".") === "name" && errors.name === undefined) {
			errors.name = issue.message;
		}
	}

	return errors;
};

export class TagController {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async index(ctx: HttpContext) {
		return this.#renderIndex(ctx, tagErrors([]));
	}

	async #renderIndex(ctx: HttpContext, errors: { name?: string }) {
		const tags = await TagsTable.create(this.#db).list();
		const tagViews = tags.map((tag) => ({
			destroyUrl: `/tags/${tag.id}`,
			id: tag.id,
			name: tag.name,
		}));

		return ctx.render("tag-index", {
			errors,
			hasTags: tagViews.length > 0 ? true : undefined,
			homeUrl: "/",
			tags: tagViews,
			tagsUrl: "/tags",
			todosUrl: "/todos",
		});
	}

	async store(ctx: HttpContext) {
		const parsed = schema
			.strictObject({
				name: schema
					.string()
					.default("")
					.transform((value) => value.trim())
					.refine((value) => value.length > 0, { message: "Required" }),
			})
			.safeParse(ctx.body());
		if (!parsed.success) {
			return this.#renderIndex(ctx, tagErrors(parsed.error.issues));
		}

		try {
			await this.#db.transaction((tx) =>
				TagsTable.create(tx).insert(parsed.data.name),
			);
			return ctx.redirect("/tags");
		} catch {
			return this.#renderIndex(ctx, { name: "Tag name must be unique" });
		}
	}

	async destroy(ctx: HttpContext) {
		const parsed = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsed.success) {
			return ctx.notFound();
		}

		const deleted = await this.#db.transaction((tx) =>
			TagsTable.create(tx).delete(parsed.data),
		);
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

		const assigned = await this.#db.transaction(async (tx) => {
			const todo = await TodosTable.create(tx).find(todoId);
			if (!todo) {
				return false;
			}

			const tagIds = [...new Set(parsed.data.tagIds)];
			if (tagIds.length > 0) {
				const tags = await TagsTable.create(tx).findByIds(tagIds);
				if (tags.length !== tagIds.length) {
					return false;
				}
			}

			await TodoTagsTable.create(tx).replaceForTodo(todoId, tagIds);
			return TodosTable.create(tx).touch(todoId);
		});
		if (!assigned) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todoId}/edit`);
	}
}
