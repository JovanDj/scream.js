import type { Application } from "@scream.js/http/application.js";
import type { Resource } from "@scream.js/http/resource.js";

export const createHttpApp = ({
	app,
	todosController,
}: {
	app: Application;
	todosController: Resource;
}) => {
	app.get("/", (ctx) =>
		ctx.render("index", {
			message: "Rendered with nunjucks",
			name: "Jovan",
		}),
	);

	app.get("/about", (ctx) => ctx.render("about"));

	app.resource("/todos", todosController);
};
