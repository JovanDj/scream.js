import type { Connection } from "./connection.js";
import type { FromBuilder } from "./query-builder/from-builder.js";
import type { ScreamQueryBuilder } from "./query-builder/scream-query-builder.js";

export class Database {
	readonly #connection: Connection;
	readonly #queryBuilder: ScreamQueryBuilder;

	constructor(connection: Connection, queryBuilder: ScreamQueryBuilder) {
		this.#connection = connection;
		this.#queryBuilder = queryBuilder;
	}

	query() {
		return this.#queryBuilder;
	}

	all<T>(cb: (query: ScreamQueryBuilder) => FromBuilder) {
		return this.#connection.all<T>(cb(this.#queryBuilder).build());
	}

	one<T>(cb: (query: ScreamQueryBuilder) => FromBuilder) {
		return this.#connection.get<T>(cb(this.#queryBuilder).build());
	}

	async transaction<T>(callback: (trx: Database) => Promise<T>) {
		return this.#connection.transaction(async (trx) => {
			return await callback(new Database(trx, this.#queryBuilder));
		});
	}
}
