import type { FlatObject } from "@scream.js/flat-object.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/resource.js";

import type { TodoService } from "./todo.service.js";

export class TodosController implements Resource {
	readonly #todoService: TodoService;

	constructor(todoService: TodoService) {
		this.#todoService = todoService;
	}

	async index(ctx: HttpContext) {
		const todos = await this.#todoService.findAll();

		return ctx.render("index", { todos });
	}

	async show(ctx: HttpContext) {
		if (!ctx.params("id")) {
			return ctx.notFound();
		}

		try {
			const todo = await this.#todoService.findById(+ctx.params("id"));

			if (!todo) {
				return ctx.notFound();
			}

			const dto: FlatObject = {
				todoTitle: todo.title,
				lang: ctx.acceptsLanguages(["en-US", "sr-Latn-RS"]),
				pageTitle: `Todo | ${todo.id}`,
			};

			return ctx.render("show", dto);
		} catch (error) {
			if (error instanceof Error) {
				return ctx.internalServerError(error.message);
			}

			return ctx.internalServerError("Unknown error");
		}
	}

	create(ctx: HttpContext) {
		return ctx.render("create");
	}

	async store(ctx: HttpContext) {
		const body = ctx.body();

		if (
			typeof body !== "object" ||
			body === null ||
			!("title" in body) ||
			typeof body["title"] !== "string"
		) {
			return ctx.status(400).json({ error: "Invalid title" });
		}

		try {
			const todo = await this.#todoService.create({
				title: body.title,
				userId: 1,
			});

			return ctx.status(201).redirect(`http://localhost:3000/todos/${todo.id}`);
		} catch (error) {
			if (error instanceof Error) {
				return ctx.internalServerError(error.message);
			}

			return ctx.internalServerError("Unknown error");
		}
	}

	edit(ctx: HttpContext) {
		return ctx.render("");
	}

	async update(ctx: HttpContext) {
		if (!ctx.params("id")) {
			return ctx.notFound();
		}

		try {
			const todo = await this.#todoService.update(+ctx.params("id"), {});
			return ctx.redirect(`http://localhost:3000/todos/${todo.id}`);
		} catch (error) {
			if (error instanceof Error) {
				return ctx.internalServerError(error.message);
			}

			return ctx.internalServerError("Unknown error");
		}
	}

	async delete(ctx: HttpContext) {
		if (!ctx.params("id")) {
			return ctx.notFound();
		}

		const changed = await this.#todoService.delete(+ctx.params("id"));

		return ctx.status(200).end(changed);
	}
}
