import type { HttpContext } from "@scream.js/http/http-context.js";
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
		const parsed = ctx.body((z) =>
			z.strictObject({
				name: z
					.string()
					.default("")
					.transform((value) => value.trim()),
			}),
		);

		if (!parsed.success || parsed.data.name.length < 1) {
			ctx.unprocessableEntity();
			const tags = await this.#tagService.findAll();
			return ctx.render("tag-index", {
				errors: { name: ["Required"] },
				pageTitle: "Tags",
				tags,
			});
		}

		try {
			await this.#tagService.create(parsed.data);
		} catch {
			ctx.unprocessableEntity();
			const tags = await this.#tagService.findAll();
			return ctx.render("tag-index", {
				errors: { name: ["Tag name must be unique"] },
				pageTitle: "Tags",
				tags,
			});
		}

		return ctx.redirect("/tags");
	}

	async delete(ctx: HttpContext) {
		const parsedId = ctx.param("id", (z) => z.coerce.number().int().positive());
		if (!parsedId.success) {
			return ctx.notFound();
		}

		const deleted = await this.#tagService.delete(parsedId.data);
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/tags");
	}

	async assignToTodo(ctx: HttpContext) {
		const parsedTodoId = ctx.param("id", (z) =>
			z.coerce.number().int().positive(),
		);
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}

		const parsed = ctx.body((z) =>
			z.strictObject({
				tagIds: z.preprocess((value) => {
					if (!value) {
						return [];
					}
					if (Array.isArray(value)) {
						return value;
					}
					return [value];
				}, z.array(z.coerce.number().int().positive()).default([])),
			}),
		);

		if (!parsed.success) {
			ctx.unprocessableEntity();
			return ctx.redirect(`/todos/${parsedTodoId.data}/edit`);
		}

		const replaced = await this.#tagService.replaceTodoTags(parsedTodoId.data, {
			tagIds: parsed.data.tagIds,
		});

		if (!replaced) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${parsedTodoId.data}/edit`);
	}
}
