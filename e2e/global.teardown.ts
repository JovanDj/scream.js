import { db } from "config/database.js";

export default async function globalTeardown() {
	await db.migrate.rollback(undefined, true);
	await db.destroy();
}
