import type { FlatObject } from "@scream.js/flat-object.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";

import { createTodoValidator } from "./todo.schema.js";
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
		const { id } = ctx.params();

		if (!id) {
			return ctx.notFound();
		}
		const todo = await this.#todoService.findById(+id);

		if (!todo) {
			return ctx.notFound();
		}

		return ctx.render("show", {
			lang: ctx.acceptsLanguages(["en-US", "sr-Latn-RS"]),

			pageTitle: `Todo | ${todo.id}`,

			todoId: todo.id,
			todoTitle: todo.title,
		} satisfies FlatObject);
	}

	async create(ctx: HttpContext) {
		return ctx.render("create");
	}

	async store(ctx: HttpContext) {
		const { value, errors } = ctx.validate(createTodoValidator);

		console.log({ errors, value });

		if (!value) {
			return ctx.render("create", { errors });
		}

		const todo = await this.#todoService.create({
			title: value.title,
			userId: value.userId,
		});

		return ctx.redirect(`/todos/${todo.id}`);
	}

	async edit(ctx: HttpContext) {
		const id = +ctx.param("id");
		const todo = await this.#todoService.findById(id);

		if (!todo) {
			return ctx.notFound();
		}

		return ctx.render("edit", {
			action: `/todos/${todo.id}/edit`,
			errors: {},
			fields: { title: todo.title, userId: todo.userId },
			pageTitle: `Edit Todo #${todo.id}`,
			submitLabel: "Update",
		});
	}

	async update(ctx: HttpContext) {
		const { value, errors } = ctx.validate(createTodoValidator);

		if (!value) {
			return ctx.render("edit", {
				action: `/todos/${ctx.param("id")}/edit`,
				errors,
				fields: {
					title: "",
					userId: 1,
				},
				pageTitle: `Edit Todo #${ctx.param("id")}`,
				submitLabel: "Submit",
			});
		}

		const todo = await this.#todoService.update(+ctx.param("id"), value);
		return ctx.redirect(`/todos/${todo.id}`);
	}

	async delete(ctx: HttpContext) {
		if (!ctx.param("id")) {
			return ctx.notFound();
		}

		const id = +ctx.param("id");
		await this.#todoService.delete(id);

		return ctx.redirect("/todos");
	}
}
