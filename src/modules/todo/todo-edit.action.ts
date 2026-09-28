import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Action } from "../action.js";
import { todoShowDataSchema, todoShowInputSchema } from "./todo.schema.js";

export class TodosEditAction implements Action {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async handle(ctx: HttpContext) {
		const parsed = todoShowInputSchema.safeParse({ id: ctx.param("id") });
		if (!parsed.success) {
			return ctx.notFound();
		}

		const row = await this.#db("todos")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": parsed.data.id })
			.select(
				"todos.due_at",
				"todos.id",
				"todos.title",
				this.#db.ref("todo_statuses.code").as("status_code"),
			)
			.first();
		if (!row) {
			return ctx.notFound();
		}
		const todo = todoShowDataSchema.parse(row);

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
