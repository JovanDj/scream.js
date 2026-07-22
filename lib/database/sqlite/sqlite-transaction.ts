import type { Transaction } from "../connection.js";
import type { SqlQuery } from "../query-builder/sql-query.js";
import type { SqliteDriver } from "./sqlite-driver.js";

export class SqliteTransaction implements Transaction {
	readonly #driver: SqliteDriver;
	#active = true;

	constructor(driver: SqliteDriver) {
		this.#driver = driver;
	}

	async all<T>(query: SqlQuery): Promise<readonly T[]> {
		this.#assertActive();
		return this.#driver.all<T>(query);
	}

	async get<T>(query: SqlQuery): Promise<T | undefined> {
		this.#assertActive();
		return this.#driver.get<T>(query);
	}

	async run(query: SqlQuery) {
		this.#assertActive();
		return this.#driver.run(query);
	}

	deactivate(): void {
		this.#active = false;
	}

	#assertActive(): void {
		if (!this.#active) {
			throw new Error("Transaction is no longer active");
		}
	}
}
