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
		const parsed = ctx.validateBody(tagWriteValidator);
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
		const parsedTagId = ctx.validateParam("id", tagIdValidator);
		if (!parsedTagId.success) {
			return ctx.notFound();
		}

		const tagId = parsedTagId.data;
		const deleted = await this.#tagService.delete(tagId);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/tags");
	}

	async assignToTodo(ctx: HttpContext) {
		const parsedTodoId = ctx.validateParam("id", tagIdValidator);
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}

		const todoId = parsedTodoId.data;
		const parsed = ctx.validateBody(replaceTodoTagsValidator);
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
