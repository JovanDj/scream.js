import { createDB } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import { createExpressApp } from "@scream.js/http/express/create-express-application.js";
import type { Logger } from "@scream.js/logger/logger.interface.js";
import { createLogger } from "@scream.js/logger/logger-factory.js";
import type { Knex } from "knex";
import { createTodoModule } from "./src/todos/index.js";

export type CreateAppOptions = Partial<{
	app: Application;
	db: Knex;
	logger: Logger;
}>;

export const createApp = ({
	app = createExpressApp(),
	db = createDB(),
	logger = createLogger(),
}: CreateAppOptions = {}) => {
	const { todoController } = createTodoModule(db, logger);

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
