import type { CommandHandler } from "@scream.js/database/command-handler.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import type { Controller } from "../controller.js";
import {
	type TodoUpdateInput,
	todoShowInputSchema,
	todoUpdateInputSchema,
} from "./todo.schema.js";
import type { UpdateTodo } from "./update-todo.service.js";

export class TodosUpdateController implements Controller {
	readonly #service: CommandHandler<UpdateTodo, { id: number } | undefined>;

	constructor(service: CommandHandler<UpdateTodo, { id: number } | undefined>) {
		this.#service = service;
	}

	async handle(ctx: HttpContext) {
		const parsedId = todoShowInputSchema.safeParse({ id: ctx.param("id") });
		if (!parsedId.success) {
			return ctx.notFound();
		}
		const todoId = parsedId.data.id;

		const parsed = todoUpdateInputSchema.safeParse(ctx.body());
		if (!parsed.success) {
			return ctx.render("edit", {
				action: `/todos/${todoId}`,
				errors: this.#todoErrors(parsed.error.issues),
				fields: {
					dueAt: "",
					isCompleted: false,
					isOpen: true,
					statusCode: "open",
					title: "",
				},
				pageTitle: `Edit Todo #${todoId}`,
				submitLabel: "Update",
				todoId,
			});
		}

		const result = await this.#service.execute({ ...parsed.data, id: todoId });
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${result.id}`);
	}

	#todoErrors(issues: z.ZodError<TodoUpdateInput>["issues"]) {
		const errors = { dueAt: "", title: "" };
		for (const issue of issues) {
			const key = issue.path.join(".");
			if (key === "title" || key === "dueAt") {
				errors[key] ||= issue.message;
			}
		}
		return errors;
	}
}
