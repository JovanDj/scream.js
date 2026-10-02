import { createProgram } from "@scream.js/cli/index.js";
import { createDB } from "@scream.js/database/db.js";

const environment = process.env["NODE_ENV"] ?? "development";
const db = createDB(environment);
const resetPolicy =
	environment === "production"
		? "blocked"
		: environment === "test" || environment === "e2e"
			? "allow"
			: "require-force";

try {
	await createProgram({ db, resetPolicy }).parseAsync(process.argv);
} finally {
	await db.destroy();
}
