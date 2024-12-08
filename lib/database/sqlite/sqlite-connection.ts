import type sqlite from "sqlite";
import type { Connection } from "../connection.js";
import { InsertResult } from "../insert-result.js";

export class SqliteConnection implements Connection, AsyncDisposable {
	readonly #db: sqlite.Database;

	constructor(db: sqlite.Database) {
		this.#db = db;
	}

	async run(queryString: string, params: string[] = []) {
		const result = await this.#db.run(queryString, params);

		return new InsertResult(result.lastID);
	}

	async all<T>(sqlString: string, params?: string[]) {
		return this.#db.all<T>(sqlString, params);
	}

	async get<T>(sqlString: string, params?: string[]) {
		return this.#db.get<T>(sqlString, params);
	}

	async close() {
		return this.#db.close();
	}

	async exec(sqlString: string) {
		return this.#db.exec(sqlString);
	}

	[Symbol.asyncDispose]() {
		return this.close();
	}
}
