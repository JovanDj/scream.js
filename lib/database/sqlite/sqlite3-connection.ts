import type sqlite from "sqlite";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

import type { Connection } from "../connection.js";
import type { ConnectionOptions } from "../connection-options.js";
import { ConnectionScheduler } from "../connection-scheduler.js";
import { ExecutionResult } from "../execution-result.js";
import type { SqlQuery } from "../query-builder/sql-query.js";
import { TransactionConnection } from "../transaction-connection.js";

export class Sqlite3Connection implements Connection {
	readonly #db: sqlite.Database;
	readonly #scheduler = new ConnectionScheduler();

	constructor(db: sqlite.Database) {
		this.#db = db;
	}

	async run(query: SqlQuery) {
		return this.#scheduler.run(() => this.#run(query));
	}

	async #run(query: SqlQuery) {
		const result = await this.#db.run(query.sql, query.params);
		const affectedRows = result.changes ?? 0;
		const insertedId =
			affectedRows > 0 && /^(INSERT|REPLACE)\b/i.test(query.sql.trimStart())
				? result.lastID
				: undefined;

		return new ExecutionResult(insertedId, affectedRows);
	}

	async all<T>(query: SqlQuery) {
		return this.#scheduler.run(() => this.#all<T>(query));
	}

	async #all<T>(query: SqlQuery) {
		return this.#db.all<T[]>(query.sql, query.params);
	}

	async get<T>(query: SqlQuery) {
		return this.#scheduler.run(() => this.#get<T>(query));
	}

	async #get<T>(query: SqlQuery) {
		return this.#db.get<T>(query.sql, query.params);
	}

	async close() {
		return this.#scheduler.run(() => this.#db.close());
	}

	static async connect(database: ConnectionOptions = { database: ":memory:" }) {
		const db = await open({
			driver: sqlite3.Database,
			filename: database.database,
		});

		await db.run("PRAGMA foreign_keys = ON;");
		await db.run("PRAGMA journal_mode=WAL");
		return new Sqlite3Connection(db);
	}

	async transaction<T>(callback: (trx: Connection) => Promise<T>) {
		return this.#scheduler.run(async () => {
			await this.#run({ params: [], sql: "BEGIN TRANSACTION;" });
			const transaction = new TransactionConnection({
				all: <Row>(query: SqlQuery) => this.#all<Row>(query),
				get: <Row>(query: SqlQuery) => this.#get<Row>(query),
				run: (query: SqlQuery) => this.#run(query),
			});

			try {
				const result = await callback(transaction);
				await this.#run({ params: [], sql: "COMMIT;" });
				return result;
			} catch (error) {
				try {
					await this.#run({ params: [], sql: "ROLLBACK;" });
				} catch {}
				throw error;
			} finally {
				transaction.deactivate();
			}
		});
	}
}
