import { db } from "config/database.js";

export default async function globalSetup() {
	await db.migrate.latest();
	await db.seed.run();
}
