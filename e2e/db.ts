import type { Database } from "@scream.js/database/db.js";

const setupDb = async (db: Database) => {
	await db.migrate.rollback(undefined, true);
	await db.migrate.latest();
	await db.seed.run();
	await db.destroy();
};

const teardownDb = async (db: Database) => {
	await db.migrate.rollback(undefined, true);
	await db.destroy();
};

export { setupDb, teardownDb };
