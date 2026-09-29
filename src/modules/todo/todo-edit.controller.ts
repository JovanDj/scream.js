import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Controller } from "../controller.js";
import type { GetTodoService } from "./get-todo.service.js";
import { todoShowInputSchema } from "./todo.schema.js";

export class TodosEditController implements Controller {
	readonly #getTodo: GetTodoService;

	constructor(getTodo: GetTodoService) {
		this.#getTodo = getTodo;
	}

	async handle(ctx: HttpContext) {
		const parsed = todoShowInputSchema.safeParse({ id: ctx.param("id") });
		if (!parsed.success) {
			return ctx.notFound();
		}

		const todo = await this.#getTodo.execute(parsed.data);
		if (!todo) {
			return ctx.notFound();
		}

		return ctx.render("edit", {
			action: `/todos/${todo.id}`,
			errors: { dueAt: "", title: "" },
			fields: {
				dueAt: todo.dueAt ?? "",
				isCompleted: todo.statusCode === "completed",
				isOpen: todo.statusCode === "open",
				statusCode: todo.statusCode,
				title: todo.title,
			},
			pageTitle: `Edit Todo #${todo.id}`,
			submitLabel: "Update",
			todoId: todo.id,
		});
	}
}
