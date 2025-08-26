import type sqlite from "sqlite";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

import type { Connection } from "../connection.js";
import type { ConnectionOptions } from "../connection-options.js";
import { InsertResult } from "../insert-result.js";
import type { SqlQuery } from "../query-builder/sql-query.js";

export class SqliteConnection implements Connection, AsyncDisposable {
	readonly #db: sqlite.Database;

	constructor(db: sqlite.Database) {
		this.#db = db;
	}

	async run(query: SqlQuery) {
		const result = await this.#db.run(query.sql, query.params);

		return new InsertResult(result.lastID);
	}

	async all<T>(query: SqlQuery) {
		return this.#db.all<T[]>(query.sql, query.params);
	}

	async get<T>(query: SqlQuery) {
		return this.#db.get<T>(query.sql, query.params);
	}

	async close() {
		return this.#db.close();
	}

	async exec(sqlString: string) {
		return this.#db.exec(sqlString);
	}

	static async connect(database: ConnectionOptions = { database: ":memory:" }) {
		const db = await open({
			driver: sqlite3.Database,
			filename: database.database,
		});

		await db.run("PRAGMA foreign_keys = ON;");
		await db.run("PRAGMA journal_mode=WAL");
		return new SqliteConnection(db);
	}

	async transaction<T>(callback: (trx: Connection) => Promise<T>) {
		try {
			await this.run({ params: [], sql: "BEGIN TRANSACTION;" });

			const result = await callback(this);

			await this.run({ params: [], sql: "COMMIT;" });
			return result;
		} catch (error) {
			await this.run({ params: [], sql: "ROLLBACK;" });
			throw error;
		}
	}

	[Symbol.asyncDispose]() {
		return this.close();
	}
}
