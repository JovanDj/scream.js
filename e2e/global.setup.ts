import { setupDb } from "@scream.js/database/db.js";

export default async function globalSetup() {
	await setupDb();
}
