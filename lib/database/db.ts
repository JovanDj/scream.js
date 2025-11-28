import knex from "knex";
import config from "./knexfile.ts";

export const createDB = () => {
	const env = process.env["NODE_ENV"] ?? "development";
	return knex(config[env] ?? "");
};

export const db = createDB();

export const setupDb = async () => {
	await db.migrate.latest();
	await db.seed.run();
};

export const teardownDb = async () => {
	await db.migrate.rollback(undefined, true);
	await db.destroy();
};
