import type { Knex } from "knex";
import { createDB } from "./db.js";

export type SetupTestDbOptions = {
	seed?: boolean;
	prepare?: (db: Knex) => Promise<void> | void;
};

export const testDatabase = {
	async setup(options: SetupTestDbOptions = {}) {
		const db = createDB();

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

export const setupTestDb = testDatabase.setup;
