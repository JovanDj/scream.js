import type { SqlExpression } from "../sql-expression.js";

export class InsertExpression implements SqlExpression {
	readonly #table: string;
	readonly #columns: readonly string[];

	constructor(table: string, columns: readonly string[]) {
		this.#table = table;
		this.#columns = columns;
	}

	interpret() {
		const columns = this.#columns.join(", ");
		const placeholders = this.#columns.map(() => "?").join(", ");

		return `INSERT INTO ${this.#table} (${columns}) VALUES (${placeholders})`;
	}
}
