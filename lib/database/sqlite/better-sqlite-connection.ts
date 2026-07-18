import BetterSqlite3 from "better-sqlite3";
import type { Connection } from "../connection.js";
import type { ConnectionOptions } from "../connection-options.js";
import { ExecutionResult } from "../execution-result.js";
import type { SqlQuery } from "../query-builder/sql-query.js";

export class BetterSqliteConnection implements Connection {
	readonly #db: BetterSqlite3.Database;

	constructor(db: BetterSqlite3.Database) {
		this.#db = db;
	}

	static async connect(options: ConnectionOptions = { database: ":memory:" }) {
		const db = new BetterSqlite3(options.database);
		db.pragma("foreign_keys = ON");
		db.pragma("journal_mode = WAL");

		return new BetterSqliteConnection(db);
	}

	async run(query: SqlQuery) {
		const result = this.#db.prepare(query.sql).run(...query.params);
		const insertedId =
			result.changes > 0 && /^(INSERT|REPLACE)\b/i.test(query.sql.trimStart())
				? Number(result.lastInsertRowid)
				: undefined;

		return new ExecutionResult(insertedId, result.changes);
	}

	async all<T>(query: SqlQuery) {
		return this.#db.prepare(query.sql).all(...query.params) as T[];
	}

	async get<T>(query: SqlQuery) {
		return this.#db.prepare(query.sql).get(...query.params) as T | undefined;
	}

	async close() {
		this.#db.close();
	}

	async transaction<T>(callback: (transaction: Connection) => Promise<T>) {
		try {
			await this.run({ params: [], sql: "BEGIN TRANSACTION" });
			const result = await callback(this);
			await this.run({ params: [], sql: "COMMIT" });

			return result;
		} catch (error) {
			await this.run({ params: [], sql: "ROLLBACK" });
			throw error;
		}
	}
}
