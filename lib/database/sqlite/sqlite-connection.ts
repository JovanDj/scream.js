import BetterSqlite3 from "better-sqlite3";

import type { Connection } from "../connection.js";
import type { ConnectionOptions } from "../connection-options.js";
import { InsertResult } from "../insert-result.js";
import type { SqlQuery } from "../query-builder/sql-query.js";

export class SqliteConnection implements Connection {
	readonly #db: BetterSqlite3.Database;

	constructor(db: BetterSqlite3.Database) {
		this.#db = db;
	}

	async run(query: SqlQuery) {
		const result = this.#prepare(query).run();

		return new InsertResult(Number(result.lastInsertRowid));
	}

	async all<T>(query: SqlQuery) {
		return this.#prepare<T>(query).all();
	}

	async get<T>(query: SqlQuery) {
		return this.#prepare<T>(query).get();
	}

	async close() {
		this.#db.close();
	}

	static async connect(database: ConnectionOptions = { database: ":memory:" }) {
		const db = new BetterSqlite3(database.database);

		db.pragma("foreign_keys = ON");
		db.pragma("journal_mode = WAL");
		return new SqliteConnection(db);
	}

	#prepare<T>(query: SqlQuery) {
		return this.#db
			.prepare<unknown[], T>(query.sql)
			.bind(
				...query.params.map((value) =>
					typeof value === "boolean" ? Number(value) : value,
				),
			);
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
}
