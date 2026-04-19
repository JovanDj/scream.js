import type { HttpContext } from "@scream.js/http/http-context.js";
import { TagService } from "./tag.service.js";

export class TagController {
	readonly #tagService: TagService;

	constructor(tagService: TagService) {
		this.#tagService = tagService;
	}

	async index(ctx: HttpContext) {
		const tags = await this.#tagService.index();
		return ctx.render("tag-index", {
			pageTitle: "Tags",
			tags,
		});
	}

	async store(ctx: HttpContext) {
		const parsed = ctx.body(TagService.writeBodyValidator());
		if (!parsed.success) {
			const tags = await this.#tagService.listForRender();
			return ctx.render("tag-index", {
				errors: parsed.errors,
				pageTitle: "Tags",
				tags,
			});
		}

		try {
			await this.#tagService.create(parsed.data.name);
			return ctx.redirect("/tags");
		} catch {
			const tags = await this.#tagService.listForRender();
			return ctx.render("tag-index", {
				errors: { name: ["Tag name must be unique"] },
				pageTitle: "Tags",
				tags,
			});
		}
	}

	async delete(ctx: HttpContext) {
		const tagId = ctx.param("id", TagService.idParamValidator());

		const deleted = await this.#tagService.delete(tagId);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/tags");
	}

	async assignToTodo(ctx: HttpContext) {
		const todoId = ctx.param("id", TagService.idParamValidator());

		const parsed = ctx.body(TagService.replaceTodoTagsBodyValidator());
		if (!parsed.success) {
			return ctx.redirect(`/todos/${todoId}/edit`);
		}

		const replaced = await this.#tagService.assignToTodo({
			tagIds: [...new Set(parsed.data.tagIds)],
			todoId,
		});

		if (!replaced) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todoId}/edit`);
	}
}
