import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import type { Action } from "../action.js";
import {
	type TodoUpdateInput,
	todoShowInputSchema,
	todoUpdateInputSchema,
} from "./todo.schema.js";

export class TodosUpdateAction implements Action {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
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

		const result = await this.#db.transaction(async (tx) => {
			const currentRow = await tx("todos")
				.where({ "todos.id": todoId })
				.select("todos.completed_at")
				.first();
			if (!currentRow) {
				return undefined;
			}

			const priority = await tx("todo_priorities")
				.where({ code: "medium" })
				.first("id");
			const status = await tx("todo_statuses")
				.where({ code: parsed.data.statusCode })
				.first("id");
			const now = new Date().toISOString();
			const completedAt =
				parsed.data.statusCode === "completed"
					? (currentRow.completed_at ?? now)
					: null;

			await tx("todos")
				.where({ id: todoId })
				.update({
					completed_at: completedAt,
					due_at: parsed.data.dueAt.length > 0 ? parsed.data.dueAt : null,
					priority_id: priority.id,
					status_id: status.id,
					title: parsed.data.title,
					updated_at: now,
				});

			return { id: todoId };
		});
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
