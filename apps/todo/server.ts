import "source-map-support/register";
import path from "node:path";
import { createDB } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import { createExpressApp } from "@scream.js/http/express/create-express-application.js";
import { startHttpServer } from "@scream.js/http/server.js";
import { createLogger } from "@scream.js/logger/logger-factory.js";
import { KnexTodoRepository } from "@todo/infra/knex-todo.repository.js";
import { createCoreServices } from "./index.js";
import { createHttpApp, createHttpControllers } from "./main.js";

const logger = createLogger();
const db = createDB();
const todoRepository = new KnexTodoRepository(db);
const { todoService } = createCoreServices({
	todoRepository,
});
const { todosController } = createHttpControllers({ todoService });

const app: Application = createExpressApp({
	appRoot: path.join(process.cwd(), "apps", "todo"),
});
createHttpApp({ app, todosController });

startHttpServer({ app, db, logger, port: 3000 });
