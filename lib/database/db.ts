import BetterSqlite3 from "better-sqlite3";
import knex, { type Knex } from "knex";
import config from "./knexfile.js";

export type Database = Knex;
export type SqliteDatabase = BetterSqlite3.Database;

export type CreateDatabaseOptions = {
	readonly environment?: string;
	readonly filename?: string;
};

const configurationFor = (environment?: string) =>
	config[environment ?? process.env["NODE_ENV"] ?? "development"];

const filenameFor = (options: CreateDatabaseOptions) => {
	if (options.filename !== undefined) {
		return options.filename;
	}

	const connection = configurationFor(options.environment)?.connection;
	if (
		connection === undefined ||
		typeof connection !== "object" ||
		!("filename" in connection) ||
		typeof connection.filename !== "string"
	) {
		throw new Error("SQLite database filename is not configured");
	}

	return connection.filename;
};

export const createDB = (options: CreateDatabaseOptions = {}): Database => {
	const configuration = configurationFor(options.environment);
	if (configuration === undefined) {
		throw new Error("Database environment is not configured");
	}

	return knex({
		...configuration,
		connection: {
			filename: filenameFor(options),
		},
	});
};

export const createSqliteDB = (
	options: CreateDatabaseOptions = {},
): SqliteDatabase => {
	const db = new BetterSqlite3(filenameFor(options));
	db.pragma("foreign_keys = ON");

	return db;
};
