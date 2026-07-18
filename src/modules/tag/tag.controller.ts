import type { HttpContext } from "@scream.js/http/http-context.js";
import { schema } from "@scream.js/validator/schema.js";
import type { TagModel } from "./tag.model.js";

const tagErrors = (
	issues: readonly { message: string; path: PropertyKey[] }[],
) => {
	const errors = { name: "" };

	for (const issue of issues) {
		if (issue.path.join(".") === "name") {
			errors.name ||= issue.message;
		}
	}

	return errors;
};

export class TagController {
	readonly #tags: TagModel;

	constructor(tags: TagModel) {
		this.#tags = tags;
	}

	async index(ctx: HttpContext) {
		return this.#renderIndex(ctx, tagErrors([]));
	}

	async #renderIndex(ctx: HttpContext, errors: { name: string }) {
		const tags = (await this.#tags.list()).map((tag) => ({
			id: tag.id,
			name: tag.name,
		}));
		return ctx.render("tag-index", {
			errors,
			pageTitle: "Tags",
			tags,
		});
	}

	async store(ctx: HttpContext) {
		const parsed = schema
			.strictObject({
				name: schema
					.string()
					.default("")
					.transform((value) => value.trim())
					.refine((value) => value.length > 0, {
						message: "Required",
					}),
			})
			.safeParse(ctx.body());
		if (!parsed.success) {
			return this.#renderIndex(ctx, tagErrors(parsed.error.issues));
		}

		try {
			await this.#tags.create(parsed.data.name);
			return ctx.redirect("/tags");
		} catch {
			return this.#renderIndex(ctx, { name: "Tag name must be unique" });
		}
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

		const deleted = await this.#tags.destroy(tagId);
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

		const replaced = await this.#tags.assignToTodo(todoId, parsed.data.tagIds);

		if (!replaced) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todoId}/edit`);
	}
}
