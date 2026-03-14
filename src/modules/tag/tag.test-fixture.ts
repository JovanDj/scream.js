import type { Database } from "@scream.js/database/db.js";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { createExpressApp } from "@scream.js/http/express/create-express-application.js";
import { startTestServer } from "@scream.js/http/server.js";
import { createHttpApp } from "../../../main.js";
import { createTodoModule } from "../todo/index.js";
import { KnexTodoRepository } from "../todo/todo.repository.js";
import { createTagModule } from "./index.js";
import { KnexTagRepository } from "./tag.repository.js";

type FixtureOptions = {
	seed?: boolean;
	prepare?: (db: Database) => Promise<void> | void;
};

export const createTagServiceFixture = async (options: FixtureOptions = {}) => {
	const { cleanup, db } = await databaseTestFixture.setup(options);
	const module = {
		...createTodoModule({
			todoRepository: KnexTodoRepository.create(db),
		}),
		...createTagModule({
			tagRepository: KnexTagRepository.create(db),
		}),
	};

	return { cleanup, module };
};

export const createTagHttpFixture = async (options: FixtureOptions = {}) => {
	const { cleanup: cleanupDb, db } = await databaseTestFixture.setup(options);
	const modules = {
		...createTodoModule({
			todoRepository: KnexTodoRepository.create(db),
		}),
		...createTagModule({
			tagRepository: KnexTagRepository.create(db),
		}),
	};
	const app = createExpressApp();

	createHttpApp({
		app,
		tagController: modules.tagController,
		todosController: modules.todosController,
	});

	const { port, shutdown } = await startTestServer(app);
	const cleanup = async () => {
		await shutdown();
		await cleanupDb();
	};

	return { cleanup, modules, port };
};
