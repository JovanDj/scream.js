import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Connection } from "./connection.js";
import {
	createConnection,
	createMigrationDB,
	type DatabaseDriver,
} from "./db.js";

export type SetupTestDbOptions = {
	driver?: DatabaseDriver;
	seed?: boolean;
};

export const sqliteDatabaseTestFixture = {
	async setup(options: SetupTestDbOptions = {}): Promise<{
		cleanup: () => Promise<void>;
		db: Connection;
	}> {
		const directory = await mkdtemp(join(tmpdir(), "scream-integration-"));
		const filename = join(directory, "test.sqlite");
		const migrationDb = createMigrationDB({
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
		const connection = await createConnection({
			filename,
			...(options.driver === undefined ? {} : { driver: options.driver }),
		});

		const cleanup = async () => {
			await connection.close();
			await rm(directory, { force: true, recursive: true });
		};

		return { cleanup, db: connection };
	},
};
