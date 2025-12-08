import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDB } from "@scream.js/database/db.js";
import { Command } from "commander";
import type { Knex } from "knex";

export const createProgram = (db: Knex) => {
	const program = new Command();

	program.name("scream");

	program
		.command("db:migrate")
		.description("Run all pending migrations")
		.alias("migrate")
		.action(async () => {
			return db.migrate.latest();
		});

	program
		.command("db:rollback")
		.description("Rollback the last migration batch")
		.alias("rollback")
		.action(async () => {
			return db.migrate.rollback();
		});

	program
		.command("db:status")
		.description("Show applied and pending migrations")
		.alias("status")
		.action(async () => {
			return db.migrate.list();
		});

	program
		.command("db:reset")
		.description("Drop and recreate schema, then run all migrations")
		.alias("reset")
		.option("--force", "Force reset outside of test/e2e environments")
		.action(async (opts: { force?: boolean }) => {
			const env = process.env["NODE_ENV"] ?? "development";

			if (env === "production") {
				console.error("Refusing to reset database in production.");
				return process.exit(1);
			}

			const isSafeEnv = env === "test" || env === "e2e";

			if (!opts?.force && !isSafeEnv) {
				console.error(
					"Reset blocked. Use --force to proceed outside of test/e2e environments.",
				);
				return process.exit(1);
			}

			await db.migrate.rollback(undefined, true);
			return db.migrate.latest();
		});

	program
		.command("db:make")
		.argument("<name>", "Name for the migration file")
		.description("Generate a new migration file")
		.alias("make:migration")
		.action(async (name: string) => {
			await db.migrate.make(name);
		});

	return program;
};

const isExecutedDirectly = () => {
	return fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "");
};

if (isExecutedDirectly()) {
	const db = createDB();

	try {
		await createProgram(db).parseAsync(process.argv);
	} finally {
		await db.destroy();
	}
}
