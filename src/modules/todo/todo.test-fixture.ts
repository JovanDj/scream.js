import type { Database } from "@scream.js/database/db.js";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { createExpressApp } from "@scream.js/http/express/create-express-application.js";
import { startTestServer } from "@scream.js/http/server.js";
import { createHttpApp } from "../../../main.js";
import { createTodoModule } from "./index.js";
import { KnexTodoRepository } from "./todo.repository.js";

type FixtureOptions = {
	seed?: boolean;
	prepare?: (db: Database) => Promise<void> | void;
};

export const createTodoServiceFixture = async (
	options: FixtureOptions = {},
) => {
	const { cleanup, db } = await databaseTestFixture.setup(options);
	const module = createTodoModule({
		todoRepository: KnexTodoRepository.create(db),
	});

	return { cleanup, module };
};

export const createTodoHttpFixture = async (options: FixtureOptions = {}) => {
	const { cleanup: cleanupDb, db } = await databaseTestFixture.setup(options);
	const modules = createTodoModule({
		todoRepository: KnexTodoRepository.create(db),
	});
	const app = createExpressApp();

	createHttpApp({ app, todosController: modules.todosController });

	const { port, shutdown } = await startTestServer(app);
	const cleanup = async () => {
		await shutdown();
		await cleanupDb();
	};

	return { cleanup, modules, port };
};
