import type { Application } from "@scream.js/http/application.interface";
import { createKoaApp } from "@scream.js/http/koa/create-koa-application";
import { todoController } from "src/todos";

export const app: Application = createKoaApp();

app.get("/", (ctx) =>
	ctx.render("index", {
		name: "Jovan",
		message: "Rendered with nunjucks",
	}),
);

app.get("/about", (ctx) => ctx.render("about"));

app.resource("/todos", todoController);
