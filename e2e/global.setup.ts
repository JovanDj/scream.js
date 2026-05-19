import { createDB } from "@scream.js/database/db.js";
import { setupDb } from "./db.js";

export default async function globalSetup() {
	await setupDb(createDB());
}
