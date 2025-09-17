import { teardownDb } from "@scream.js/database/db.js";

export default async function globalTeardown() {
	await teardownDb();
}
