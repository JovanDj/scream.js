import type { Connection } from "./connection.js";
import type { SqlQuery } from "./query-builder/sql-query.js";

export class TransactionConnection implements Connection {
	readonly #connection: Pick<Connection, "all" | "get" | "run">;
	#active = true;

	constructor(connection: Pick<Connection, "all" | "get" | "run">) {
		this.#connection = connection;
	}

	async all<T>(query: SqlQuery): Promise<T[]> {
		this.#assertActive();
		return this.#connection.all<T>(query);
	}

	async get<T>(query: SqlQuery): Promise<T | undefined> {
		this.#assertActive();
		return this.#connection.get<T>(query);
	}

	async run(query: SqlQuery) {
		this.#assertActive();
		return this.#connection.run(query);
	}

	async close(): Promise<void> {
		this.#assertActive();
		throw new Error("Cannot close a transaction connection");
	}

	async transaction<T>(
		_callback: (transaction: Connection) => Promise<T>,
	): Promise<T> {
		this.#assertActive();
		throw new Error("Nested transactions are not supported");
	}

	deactivate(): void {
		this.#active = false;
	}

	#assertActive(): void {
		if (!this.#active) {
			throw new Error("Transaction connection is no longer active");
		}
	}
}
