import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import { StoreAction, type StoreFailure } from "../store.action.js";
import { type TodoStoreInput, todoStoreInputSchema } from "./todo.schema.js";

export class TodosStoreAction extends StoreAction<TodoStoreInput, number> {
	protected inputSchema() {
		return todoStoreInputSchema;
	}

	protected async persist(input: TodoStoreInput, db: Database) {
		const priority = await db("todo_priorities")
			.where({ code: "medium" })
			.first("id");
		const status = await db("todo_statuses")
			.where({ code: "open" })
			.first("id");
		const now = new Date().toISOString();
		const [row] = await db("todos")
			.insert({
				completed_at: null,
				created_at: now,
				description: "",
				due_at: input.dueAt.length > 0 ? input.dueAt : null,
				priority_id: priority.id,
				status_id: status.id,
				title: input.title,
				updated_at: now,
			})
			.returning(["id"]);
		return row.id;
	}

	protected redirectUrl(id: number) {
		return `/todos/${id}`;
	}

	protected validationFailed(
		ctx: HttpContext,
		error: z.ZodError<TodoStoreInput>,
	) {
		const errors = { dueAt: "", title: "" };
		for (const issue of error.issues) {
			const key = issue.path.join(".");
			if (key === "title" || key === "dueAt") {
				errors[key] ||= issue.message;
			}
		}
		return ctx.render("create", {
			errors,
			fields: {
				dueAt: "",
				isCompleted: false,
				isOpen: true,
				statusCode: "open",
				title: "",
			},
			pageTitle: "New Todo",
		});
	}

	protected persistenceFailed({ error }: StoreFailure<TodoStoreInput>) {
		throw error;
	}
}
