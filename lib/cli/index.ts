import type { Database } from "@scream.js/database/db.js";
import { Command } from "commander";

export const createProgram = ({
	db,
	output = console.log,
	resetPolicy = "blocked",
}: {
	db: Database;
	output?: (line: string) => void;
	resetPolicy?: "blocked" | "require-force" | "allow";
}) => {
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
			const [completed, pending] = await db.migrate.list();
			for (const migration of completed) {
				output(`up ${migration.name}`);
			}
			for (const migration of pending) {
				output(`pending ${migration.file}`);
			}
			if (completed.length === 0 && pending.length === 0) {
				output("No migrations found.");
			}
		});

	program
		.command("db:seed")
		.description("Run application seeds")
		.action(async () => {
			await db.seed.run();
		});

	program
		.command("db:reset")
		.description("Drop and recreate schema, then run all migrations")
		.alias("reset")
		.option("--force", "Confirm reset when required by the application")
		.action(async (opts: { force?: boolean }) => {
			if (resetPolicy === "blocked") {
				throw new Error("Refusing to reset database.");
			}

			if (resetPolicy === "require-force" && !opts.force) {
				throw new Error("Reset blocked. Use --force to proceed.");
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
