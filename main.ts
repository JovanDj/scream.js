import type { Application } from "@scream.js/http/application.js";
import { ScreamApplication } from "@scream.js/http/scream/scream-application.js";

import { todoController } from "src/todos/index.js";

export const app: Application = new ScreamApplication();

app.get("/", (ctx) =>
	ctx.render("index", {
		name: "Jovan",
		message: "Rendered with nunjucks",
	}),
);

app.get("/about", (ctx) => ctx.render("about"));

app.resource("/todos", todoController);
