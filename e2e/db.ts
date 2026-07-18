import type { MigrationDatabase } from "@scream.js/database/db.js";

const setupDb = async (db: MigrationDatabase) => {
	await db.migrate.rollback(undefined, true);
	await db.migrate.latest();
	await db.seed.run();
	await db.destroy();
};

const teardownDb = async (db: MigrationDatabase) => {
	await db.migrate.rollback(undefined, true);
	await db.destroy();
};

export { setupDb, teardownDb };
