import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Controller } from "../controller.js";

export class TodosCreateController implements Controller {
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
