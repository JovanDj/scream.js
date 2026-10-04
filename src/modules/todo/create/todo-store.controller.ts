import {
	StoreController,
	type StoreFailure,
} from "@scream.js/http/controllers/store.controller.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { z } from "zod/v4";
import { type TodoStoreInput, todoStoreInputSchema } from "../todo.schema.js";

export class TodosStoreController extends StoreController<
	TodoStoreInput,
	number
> {
	protected inputSchema() {
		return todoStoreInputSchema;
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
		return ctx.render("todo/create", {
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
