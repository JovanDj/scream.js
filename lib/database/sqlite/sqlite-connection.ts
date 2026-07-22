import type { Connection, Transaction } from "../connection.js";
import type { ConnectionScheduler } from "../connection-scheduler.js";
import type { SqlQuery } from "../query-builder/sql-query.js";
import type { SqliteDriver } from "./sqlite-driver.js";
import { SqliteTransaction } from "./sqlite-transaction.js";

export class SqliteConnection implements Connection {
	readonly #driver: SqliteDriver;
	readonly #scheduler: ConnectionScheduler;
	#open = true;

	constructor(driver: SqliteDriver, scheduler: ConnectionScheduler) {
		this.#driver = driver;
		this.#scheduler = scheduler;
	}

	async run(query: SqlQuery) {
		this.#assertOpen();
		return this.#scheduler.run(() => this.#driver.run(query));
	}

	async all<T>(query: SqlQuery): Promise<readonly T[]> {
		this.#assertOpen();
		return this.#scheduler.run(() => this.#driver.all<T>(query));
	}

	async get<T>(query: SqlQuery): Promise<T | undefined> {
		this.#assertOpen();
		return this.#scheduler.run(() => this.#driver.get<T>(query));
	}

	async transaction<T>(
		operation: (transaction: Transaction) => Promise<T>,
	): Promise<T> {
		this.#assertOpen();
		return this.#scheduler.run(async () => {
			await this.#driver.run({ params: [], sql: "BEGIN TRANSACTION" });
			const transaction = new SqliteTransaction(this.#driver);

			try {
				const result = await operation(transaction);
				await this.#driver.run({ params: [], sql: "COMMIT" });
				return result;
			} catch (error) {
				try {
					await this.#driver.run({ params: [], sql: "ROLLBACK" });
				} catch (rollbackError) {
					throw new AggregateError(
						[error, rollbackError],
						"Transaction and rollback failed",
					);
				}
				throw error;
			} finally {
				transaction.deactivate();
			}
		});
	}

	async close(): Promise<void> {
		this.#assertOpen();
		this.#open = false;
		return this.#scheduler.run(() => this.#driver.close());
	}

	#assertOpen(): void {
		if (!this.#open) {
			throw new Error("Connection is closed");
		}
	}
}
