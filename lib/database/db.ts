import knex, { type Knex } from "knex";
import config from "./knexfile.js";

export type Database = Knex;
export type DatabaseTransaction = Knex.Transaction;
export type DatabaseHandle = Database | DatabaseTransaction;

export const createDB = (env?: string): Database => {
	const resolvedEnv = env ?? process.env["NODE_ENV"] ?? "development";
	return knex(config[resolvedEnv] ?? "");
};

export const setupDb = async (db: Database) => {
	// E2E uses a file-backed SQLite DB, so reset before seeding to avoid
	// unique constraint collisions from leftover data between runs.
	await db.migrate.rollback(undefined, true);
	await db.migrate.latest();
	await db.seed.run();
	await db.destroy();
};

export const teardownDb = async (db: Database) => {
	await db.migrate.rollback(undefined, true);
	await db.destroy();
};
