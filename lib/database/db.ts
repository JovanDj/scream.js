import knex from "knex";
import config from "./knexfile.ts";

const env = process.env["NODE_ENV"] ?? "development";
export const db = knex(config[env] ?? "");

export const setupDb = async () => {
	await db.migrate.latest();
	await db.seed.run();
};

export const teardownDb = async () => {
	await db.migrate.rollback(undefined, true);
	await db.destroy();
};
