import BetterSqlite3 from "better-sqlite3";
import type { Connection } from "../connection.js";
import type { ConnectionOptions } from "../connection-options.js";
import { ConnectionScheduler } from "../connection-scheduler.js";
import { ExecutionResult } from "../execution-result.js";
import type { SqlQuery } from "../query-builder/sql-query.js";
import { TransactionConnection } from "../transaction-connection.js";

export class BetterSqliteConnection implements Connection {
	readonly #db: BetterSqlite3.Database;
	readonly #scheduler = new ConnectionScheduler();

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
		return this.#scheduler.run(() => this.#run(query));
	}

	async #run(query: SqlQuery) {
		const result = this.#db.prepare(query.sql).run(...query.params);
		const insertedId =
			result.changes > 0 && /^(INSERT|REPLACE)\b/i.test(query.sql.trimStart())
				? Number(result.lastInsertRowid)
				: undefined;

		return new ExecutionResult(insertedId, result.changes);
	}

	async all<T>(query: SqlQuery) {
		return this.#scheduler.run(() => this.#all<T>(query));
	}

	async #all<T>(query: SqlQuery) {
		return this.#db.prepare(query.sql).all(...query.params) as T[];
	}

	async get<T>(query: SqlQuery) {
		return this.#scheduler.run(() => this.#get<T>(query));
	}

	async #get<T>(query: SqlQuery) {
		return this.#db.prepare(query.sql).get(...query.params) as T | undefined;
	}

	async close() {
		return this.#scheduler.run(async () => {
			this.#db.close();
		});
	}

	async transaction<T>(callback: (transaction: Connection) => Promise<T>) {
		return this.#scheduler.run(async () => {
			await this.#run({ params: [], sql: "BEGIN TRANSACTION" });
			const transaction = new TransactionConnection({
				all: <Row>(query: SqlQuery) => this.#all<Row>(query),
				get: <Row>(query: SqlQuery) => this.#get<Row>(query),
				run: (query: SqlQuery) => this.#run(query),
			});

			try {
				const result = await callback(transaction);
				await this.#run({ params: [], sql: "COMMIT" });
				return result;
			} catch (error) {
				try {
					await this.#run({ params: [], sql: "ROLLBACK" });
				} catch {}
				throw error;
			} finally {
				transaction.deactivate();
			}
		});
	}
}
