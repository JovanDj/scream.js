import type { HttpContext } from "@scream.js/http/http-context.js";

export class PagesController {
	index(ctx: HttpContext) {
		return ctx.render("home", {
			pageTitle: "ScreamJS Todo App",
		});
	}

	about(ctx: HttpContext) {
		return ctx.render("about");
	}
}
