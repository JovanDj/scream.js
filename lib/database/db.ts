import knex, { type Knex } from "knex";
import config from "./knexfile.ts";

export const createDB = () => {
	const env = process.env["NODE_ENV"] ?? "development";
	return knex(config[env] ?? "");
};

export const setupDb = async (db: Knex) => {
	await db.migrate.latest();
	await db.seed.run();
	await db.destroy();
};

export const teardownDb = async (db: Knex) => {
	await db.migrate.rollback(undefined, true);
	await db.destroy();
};
