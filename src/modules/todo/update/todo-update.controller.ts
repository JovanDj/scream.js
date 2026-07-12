import type { CommandHandler } from "@scream.js/database/command-handler.js";
import type { Controller } from "@scream.js/http/controller.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import {
	type TodoUpdateInput,
	todoShowInputSchema,
	todoUpdateInputSchema,
} from "../todo.schema.js";
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
			return ctx.render("todo/edit", {
				action: `/todos/${todoId}`,
				errors: this.#todoErrors(parsed.error.issues),
				fields: {
					dueAt: "",
					isCompleted: undefined,
					isOpen: true,
					statusCode: "open",
					title: "",
				},
				homeUrl: "/",
				notesUrl: "/project-notes",
				tagsUrl: "/tags",
				todoId,
				todosUrl: "/todos",
				todoUrl: `/todos/${todoId}`,
			});
		}

		const result = await this.#service.execute({ ...parsed.data, id: todoId });
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${result.id}`);
	}

	#todoErrors(issues: z.ZodError<TodoUpdateInput>["issues"]) {
		const errors: { dueAt?: string; title?: string } = {};
		for (const issue of issues) {
			const key = issue.path.join(".");
			if (key === "title" || key === "dueAt") {
				errors[key] ||= issue.message;
			}
		}
		return errors;
	}
}
