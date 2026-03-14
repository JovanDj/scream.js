import { createDB, type Database } from "./db.js";

export type SetupTestDbOptions = {
	seed?: boolean;
	prepare?: (db: Database) => Promise<void> | void;
};

export const databaseTestFixture = {
	async setup(options: SetupTestDbOptions = {}) {
		// Each setup call provisions a fresh DB instance backed by the in-memory
		// integration config, which keeps DB-backed tests isolated and safe to run
		// concurrently without relying on process env mutation.
		const db = createDB("integration");

		await db.migrate.latest();

		if (options.seed) {
			await db.seed.run();
		}

		if (options.prepare) {
			await options.prepare(db);
		}

		const cleanup = async () => {
			await db.migrate.rollback(undefined, true);
			await db.destroy();
		};

		return { cleanup, db };
	},
};
