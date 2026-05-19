import { createDB } from "@scream.js/database/db.js";
import { teardownDb } from "./db.js";

export default async function globalTeardown() {
	await teardownDb(createDB());
}
