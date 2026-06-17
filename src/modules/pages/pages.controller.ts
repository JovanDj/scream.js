import type { HttpContext } from "@scream.js/http/http-context.js";

export class PagesController {
	index(ctx: HttpContext) {
		return ctx.render("home", {
			homeUrl: "/",
			pageTitle: "ScreamJS Todo App",
			tagsUrl: "/tags",
			todosUrl: "/todos",
		});
	}

	about(ctx: HttpContext) {
		return ctx.render("about", {
			todosUrl: "/todos",
		});
	}
}
