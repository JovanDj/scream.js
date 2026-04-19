import { pathToFileURL } from "node:url";
import { createDB } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import { ExpressApp } from "@scream.js/http/express/express-application.js";
import { startHttpServer } from "@scream.js/http/server.js";
import { createLogger } from "@scream.js/logger/logger-factory.js";
import "source-map-support/register";
import { PagesModule } from "./src/modules/pages/index.js";
import { ProjectModule } from "./src/modules/project/index.js";

export const createServer = () => {
	const logger = createLogger();
	const db = createDB();
	const modules = [PagesModule.create(), ProjectModule.create(db)];

	const app: Application = ExpressApp.create();
	for (const module of modules) {
		module.mount(app);
	}

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
