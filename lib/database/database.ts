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

	one<T>(cb: (query: ScreamQueryBuilder) => FromBuilder) {
		return this.#connection.get<T>(cb(this.#queryBuilder).build());
	}
}
