import BetterSqlite3 from "better-sqlite3";
import type { ConnectionOptions } from "../connection-options.js";
import { ExecutionResult } from "../execution-result.js";
import type { SqlQuery } from "../query-builder/sql-query.js";
import type { SqliteDriver } from "./sqlite-driver.js";

export class BetterSqliteDriver implements SqliteDriver {
	readonly #db: BetterSqlite3.Database;

	constructor(db: BetterSqlite3.Database) {
		this.#db = db;
	}

	static async connect(options: ConnectionOptions = { database: ":memory:" }) {
		const db = new BetterSqlite3(options.database);
		db.pragma("foreign_keys = ON");
		db.pragma("journal_mode = WAL");

		return new BetterSqliteDriver(db);
	}

	async run(query: SqlQuery) {
		const result = this.#db.prepare(query.sql).run(...query.params);
		const insertedId =
			result.changes > 0 && /^(INSERT|REPLACE)\b/i.test(query.sql.trimStart())
				? Number(result.lastInsertRowid)
				: undefined;

		return new ExecutionResult(insertedId, result.changes);
	}

	async all<T>(query: SqlQuery): Promise<readonly T[]> {
		return this.#db.prepare(query.sql).all(...query.params) as T[];
	}

	async get<T>(query: SqlQuery) {
		return this.#db.prepare(query.sql).get(...query.params) as T | undefined;
	}

	async close() {
		this.#db.close();
	}
}
