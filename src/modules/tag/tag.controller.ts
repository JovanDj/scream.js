import type { HttpContext } from "@scream.js/http/http-context.js";
import {
	replaceTodoTagsValidator,
	tagIdValidator,
	tagWriteValidator,
} from "./tag.schema.js";
import type { TagService } from "./tag.service.js";

export class TagController {
	readonly #tagService: TagService;

	constructor(tagService: TagService) {
		this.#tagService = tagService;
	}

	async index(ctx: HttpContext) {
		const tags = await this.#tagService.findAll();
		return ctx.render("tag-index", {
			pageTitle: "Tags",
			tags,
		});
	}

	async store(ctx: HttpContext) {
		const parsed = ctx.body(tagWriteValidator);
		if (!parsed.success) {
			ctx.unprocessableEntity();
			return ctx.render("tag-index", {
				errors: parsed.errors,
				pageTitle: "Tags",
				tags: await this.#tagService.findAll(),
			});
		}

		try {
			await this.#tagService.create(parsed.data);
			return ctx.redirect("/tags");
		} catch {
			ctx.unprocessableEntity();
			return ctx.render("tag-index", {
				errors: { name: ["Tag name must be unique"] },
				pageTitle: "Tags",
				tags: await this.#tagService.findAll(),
			});
		}
	}

	async delete(ctx: HttpContext) {
		const tagId = ctx.param("id", tagIdValidator);
		if (!tagId) {
			return ctx.notFound();
		}

		const deleted = await this.#tagService.delete(tagId);
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

		const replaced = await this.#tagService.replaceTodoTags(todoId, {
			tagIds: parsed.data.tagIds,
		});

		if (!replaced) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todoId}/edit`);
	}
}
