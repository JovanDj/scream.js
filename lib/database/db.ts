import knex, { type Knex } from "knex";
import type { Connection } from "./connection.js";
import config from "./knexfile.js";
import { BetterSqliteConnection } from "./sqlite/better-sqlite-connection.js";
import { Sqlite3Connection } from "./sqlite/sqlite3-connection.js";

export type MigrationDatabase = Knex;
export type DatabaseDriver = "better-sqlite3" | "sqlite3";

export type DatabaseOptions = {
	readonly driver?: DatabaseDriver;
	readonly environment?: string;
	readonly filename?: string;
};

const configurationFor = (environment?: string) => {
	const configuration =
		config[environment ?? process.env["NODE_ENV"] ?? "development"];
	if (configuration === undefined) {
		throw new Error("Database environment is not configured");
	}

	return configuration;
};

const filenameFor = (options: DatabaseOptions) => {
	if (options.filename !== undefined) {
		return options.filename;
	}

	const connection = configurationFor(options.environment).connection;
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

export const createMigrationDB = (
	options: Omit<DatabaseOptions, "driver"> = {},
): MigrationDatabase => {
	const configuration = configurationFor(options.environment);

	return knex({
		...configuration,
		connection: {
			filename: filenameFor(options),
		},
	});
};

export const createConnection = async (
	options: DatabaseOptions = {},
): Promise<Connection> => {
	const connectionOptions = { database: filenameFor(options) };
	if (options.driver === "sqlite3") {
		return Sqlite3Connection.connect(connectionOptions);
	}

	return BetterSqliteConnection.connect(connectionOptions);
};
