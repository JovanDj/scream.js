import { createConnection } from "@scream.js/database/db.js";
import type { Application } from "@scream.js/http/application.js";
import { ExpressApp } from "@scream.js/http/express/express-application.js";
import type { HttpModule } from "@scream.js/http/module.js";
import { HttpServer } from "@scream.js/http/server.js";
import type { Logger } from "@scream.js/logger/logger.interface.js";
import { createLogger } from "@scream.js/logger/logger-factory.js";
import { PagesModule } from "./src/modules/pages/index.js";
import { ProjectModule } from "./src/modules/project/index.js";
import { TagModule } from "./src/modules/tag/index.js";
import { TodoModule } from "./src/modules/todo/index.js";

const startServer = async () => {
	const logger: Logger = createLogger();
	const connection = await createConnection();

	const modules: HttpModule[] = [
		PagesModule.create(),
		ProjectModule.create(connection),
		TagModule.create(connection),
		TodoModule.create(connection),
	];

	const app: Application = ExpressApp.create();

	for (const module of modules) {
		module.mount(app);
	}

	return HttpServer.start({
		app,
		onListening: (port) => logger.log(`Listening on port ${port}`),
		onShutdown: async () => {
			await connection.close();
		},
		port: 3000,
	});
};

await startServer();
