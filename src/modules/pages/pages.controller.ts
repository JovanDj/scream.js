import type { HttpContext } from "@scream.js/http/http-context.js";

export class PagesController {
	index(ctx: HttpContext) {
		return ctx.render("home", {
			homeUrl: "/",
			tagsUrl: "/tags",
			todosUrl: "/todos",
		});
	}

	about(ctx: HttpContext) {
		return ctx.render("about", {
			homeUrl: "/",
			tagsUrl: "/tags",
			todosUrl: "/todos",
		});
	}
}
