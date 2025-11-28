import { createDB } from "@scream.js/database/db.js";
import { createExpressApp } from "@scream.js/http/express/create-express-application.js";
import { createTodoModule } from "./src/todos/index.js";

export const createApp = () => {
	const app = createExpressApp();
	const db = createDB();
	const { todoController } = createTodoModule(db);

	app.get("/", (ctx) =>
		ctx.render("index", {
			message: "Rendered with nunjucks",
			name: "Jovan",
		}),
	);

	app.get("/about", (ctx) => ctx.render("about"));

	app.resource("/todos", todoController);

	return { app, db };
};
