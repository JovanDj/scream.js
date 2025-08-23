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

		const dto: FlatObject = {
			todoTitle: todo.title,
			lang: ctx.acceptsLanguages(["en-US", "sr-Latn-RS"]),
			pageTitle: `Todo | ${todo.id}`,
		};

		return ctx.render("show", dto);
	}

	async create(ctx: HttpContext) {
		return ctx.render("create");
	}

	async store(ctx: HttpContext) {
		const { value, errors } = ctx.validate(createTodoValidator);

		console.log({ value, errors });

		if (!value) {
			return ctx.render("create", { errors });
		}

		const todo = await this.#todoService.create({
			title: value.title,
			userId: value.userId,
		});

		return ctx.status(201).redirect(`http://localhost:3000/todos/${todo.id}`);
	}

	async edit(ctx: HttpContext) {
		return ctx.render("");
	}

	async update(ctx: HttpContext) {
		if (!ctx.param("id")) {
			return ctx.notFound();
		}

		const todo = await this.#todoService.update(+ctx.param("id"), {});
		return ctx.redirect(`http://localhost:3000/todos/${todo.id}`);
	}

	async delete(ctx: HttpContext) {
		if (!ctx.param("id")) {
			return ctx.notFound();
		}

		const changed = await this.#todoService.delete(+ctx.param("id"));

		return ctx.status(200).end(changed);
	}
}
