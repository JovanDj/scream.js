import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import type { TodoService } from "../../core/todos/todo.service.js";
import { todoValidator } from "./todo.schema.js";

export class TodosController implements Resource {
	readonly #todoService: TodoService;

	constructor(todoService: TodoService) {
		this.#todoService = todoService;
	}

	async index(ctx: HttpContext) {
		const todos = await this.#todoService.findAll();

		return ctx.render("index", { pageTitle: "Todos", todos });
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
			todoCompleted: todo.completed,

			todoId: todo.id,
			todoTitle: todo.title,
		});
	}

	async create(ctx: HttpContext) {
		return ctx.render("create");
	}

	async store(ctx: HttpContext) {
		const { value, errors } = ctx.validate(todoValidator);

		if (!value) {
			return ctx.render("create", { errors });
		}

		const todo = await this.#todoService.create({ ...value });

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
		const { value, errors } = ctx.validate(todoValidator);

		if (!value) {
			const existing = await this.#todoService.findById(+ctx.param("id"));

			if (!existing) {
				return ctx.notFound();
			}

			return ctx.render("edit", {
				action: `/todos/${existing.id}/edit`,
				errors,
				fields: {
					completed: existing.completed,
					title: existing.title,
				},
				pageTitle: `Edit Todo #${existing.id}`,
				submitLabel: "Update",
			});
		}

		const todo = await this.#todoService.update(+ctx.param("id"), {
			...value,
		});
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
