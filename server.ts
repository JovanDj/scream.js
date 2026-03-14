import "source-map-support/register";
import { pathToFileURL } from "node:url";
import { createDB } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import { createExpressApp } from "@scream.js/http/express/create-express-application.js";
import { startHttpServer } from "@scream.js/http/server.js";
import { createLogger } from "@scream.js/logger/logger-factory.js";
import { createHttpApp } from "main.js";
import { createProjectModule } from "@/modules/project";
import { createTagModule } from "@/modules/tag";
import { createTodoModule } from "@/modules/todo";
import { KnexProjectRepository } from "./src/modules/project/project.repository.js";
import { KnexTagRepository } from "./src/modules/tag/tag.repository.js";
import { KnexTodoRepository } from "./src/modules/todo/todo.repository.js";

export const createServer = () => {
	const logger = createLogger();
	const db = createDB();
	const { projectController } = createProjectModule({
		projectRepository: KnexProjectRepository.create(db),
	});
	const { tagController } = createTagModule({
		tagRepository: KnexTagRepository.create(db),
	});
	const { todosController } = createTodoModule({
		todoRepository: KnexTodoRepository.create(db),
	});

	const app: Application = createExpressApp();
	createHttpApp({
		app,
		projectController,
		tagController,
		todosController,
	});

	return { app, db, logger };
};

export const startServer = () => {
	const { app, db, logger } = createServer();
	return startHttpServer({ app, db, logger, port: 3000 });
};

if (process.argv[1]) {
	const currentFileUrl = pathToFileURL(process.argv[1]).href;
	if (import.meta.url === currentFileUrl) {
		startServer();
	}
}
