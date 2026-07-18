import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDB, createSqliteDB, type Database } from "./db.js";

export type SetupTestDbOptions = {
	seed?: boolean;
	prepare?: (db: Database) => Promise<void> | void;
};

export const databaseTestFixture = {
	async setup(options: SetupTestDbOptions = {}) {
		// Each setup call provisions a fresh DB instance backed by the in-memory
		// integration config, which keeps DB-backed tests isolated and safe to run
		// concurrently without relying on process env mutation.
		const db = createDB({ environment: "integration" });

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

export const sqliteDatabaseTestFixture = {
	async setup(options: Pick<SetupTestDbOptions, "seed"> = {}) {
		const directory = await mkdtemp(join(tmpdir(), "scream-integration-"));
		const filename = join(directory, "test.sqlite");
		const migrationDb = createDB({
			environment: "integration",
			filename,
		});

		try {
			await migrationDb.migrate.latest();

			if (options.seed) {
				await migrationDb.seed.run();
			}
		} catch (error) {
			await migrationDb.destroy();
			await rm(directory, { force: true, recursive: true });
			throw error;
		}

		await migrationDb.destroy();
		const sqliteDb = createSqliteDB({ filename });

		const cleanup = async () => {
			sqliteDb.close();
			await rm(directory, { force: true, recursive: true });
		};

		return { cleanup, db: sqliteDb };
	},
};
