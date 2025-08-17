import type { Application } from "@scream.js/http/application.js";

import { createExpressApp } from "@scream.js/http/express/create-express-application.js";
import { todoController } from "./src/todos/index.js";

export const app: Application = createExpressApp();

app.get("/", (ctx) =>
	ctx.render("index", {
		name: "Jovan",
		message: "Rendered with nunjucks",
	}),
);

app.get("/about", (ctx) => ctx.render("about"));

app.resource("/todos", todoController);
