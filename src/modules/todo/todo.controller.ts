import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import type { TodoService } from "./todo.service.js";

export class TodosController implements Resource {
	readonly #todoService: TodoService;

	constructor(todoService: TodoService) {
		this.#todoService = todoService;
	}

	async index(ctx: HttpContext) {
		const todos = await this.#todoService.findAll();

		return ctx.render("index", {
			pageTitle: "Todos",
			todos,
		});
	}

	async show(ctx: HttpContext) {
		const parsedId = ctx.param("id", (z) => z.coerce.number().int().positive());

		if (!parsedId.success) {
			return ctx.notFound();
		}

		const todo = await this.#todoService.findById(parsedId.data);

		if (!todo) {
			return ctx.notFound();
		}

		return ctx.render("show", {
			pageTitle: `Todo | ${todo.id}`,
			todoCompleted: todo.completed,
			todoId: todo.id,
			todoTitle: todo.title,
		});
	}

	async create(ctx: HttpContext) {
		return ctx.render("create", { errors: {} });
	}

	async store(ctx: HttpContext) {
		const parsed = ctx.body((z) =>
			z.strictObject({
				completed: z.union([z.boolean(), z.stringbool()]).default(false),
				title: z
					.string()
					.default("")
					.transform((value) => value.trim()),
			}),
		);

		if (!parsed.success || parsed.data.title.length < 1) {
			ctx.unprocessableEntity();
			return ctx.render("create", { errors: { title: ["Required"] } });
		}

		const input: Readonly<{ title: string; completed: boolean }> = {
			completed: parsed.data.completed,
			title: parsed.data.title,
		};
		const todo = await this.#todoService.create(input);
		return ctx.redirect(`/todos/${todo.id}`);
	}

	async edit(ctx: HttpContext) {
		const parsedId = ctx.param("id", (z) => z.coerce.number().int().positive());
		if (!parsedId.success) {
			return ctx.notFound();
		}

		const todo = await this.#todoService.findById(parsedId.data);
		if (!todo) {
			return ctx.notFound();
		}

		return ctx.render("edit", {
			action: `/todos/${todo.id}/edit`,
			errors: {},
			fields: {
				completed: todo.completed,
				title: todo.title,
			},
			pageTitle: `Edit Todo #${todo.id}`,
			submitLabel: "Update",
			todoId: todo.id,
		});
	}

	async update(ctx: HttpContext) {
		const parsedId = ctx.param("id", (z) => z.coerce.number().int().positive());
		if (!parsedId.success) {
			return ctx.notFound();
		}

		const todoId = parsedId.data;
		const parsed = ctx.body((z) =>
			z.strictObject({
				completed: z.union([z.boolean(), z.stringbool()]).default(false),
				title: z
					.string()
					.default("")
					.transform((value) => value.trim()),
			}),
		);

		if (!parsed.success || parsed.data.title.length < 1) {
			ctx.unprocessableEntity();
			return ctx.render("edit", {
				action: `/todos/${todoId}/edit`,
				errors: { title: ["Required"] },
				fields: {
					completed: parsed.success ? parsed.data.completed : false,
					title: parsed.success ? parsed.data.title : "",
				},
				pageTitle: `Edit Todo #${todoId}`,
				submitLabel: "Update",
				todoId,
			});
		}

		const input: Readonly<{ title: string; completed: boolean }> = {
			completed: parsed.data.completed,
			title: parsed.data.title,
		};
		const todo = await this.#todoService.update(todoId, input);

		if (!todo) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${todo.id}`);
	}

	async delete(ctx: HttpContext) {
		const parsedId = ctx.param("id", (z) => z.coerce.number().int().positive());
		if (!parsedId.success) {
			return ctx.notFound();
		}

		const deleted = await this.#todoService.delete(parsedId.data);

		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/todos");
	}
}
