import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Action } from "../action.js";

export class TodosCreateAction implements Action {
	async handle(ctx: HttpContext) {
		return ctx.render("create", {
			errors: { dueAt: "", title: "" },
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
}
