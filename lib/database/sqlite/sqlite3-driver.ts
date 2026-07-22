import type sqlite from "sqlite";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

import type { ConnectionOptions } from "../connection-options.js";
import { ExecutionResult } from "../execution-result.js";
import type { SqlQuery } from "../query-builder/sql-query.js";
import type { SqliteDriver } from "./sqlite-driver.js";

export class Sqlite3Driver implements SqliteDriver {
	readonly #db: sqlite.Database;

	constructor(db: sqlite.Database) {
		this.#db = db;
	}

	async run(query: SqlQuery) {
		const result = await this.#db.run(query.sql, query.params);
		const affectedRows = result.changes ?? 0;
		const insertedId =
			affectedRows > 0 && /^(INSERT|REPLACE)\b/i.test(query.sql.trimStart())
				? result.lastID
				: undefined;

		return new ExecutionResult(insertedId, affectedRows);
	}

	async all<T>(query: SqlQuery): Promise<readonly T[]> {
		return this.#db.all<T[]>(query.sql, query.params);
	}

	async get<T>(query: SqlQuery) {
		return this.#db.get<T>(query.sql, query.params);
	}

	async close() {
		return this.#db.close();
	}

	static async connect(database: ConnectionOptions = { database: ":memory:" }) {
		const db = await open({
			driver: sqlite3.Database,
			filename: database.database,
		});

		await db.run("PRAGMA foreign_keys = ON;");
		await db.run("PRAGMA journal_mode=WAL");
		return new Sqlite3Driver(db);
	}
}
