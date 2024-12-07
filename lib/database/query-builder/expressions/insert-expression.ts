import type { SqlExpression } from "../sql-expression.js";

export class InsertExpression implements SqlExpression {
	readonly #table: string;
	readonly #values: Record<string, number | string>;

	constructor(table: string, values: Record<string, number | string>) {
		this.#table = table;
		this.#values = values;
	}

	interpret() {
		const columns = Object.keys(this.#values).join(", ");
		const values = Object.values(this.#values)
			.map((value) => `'${value.toString()}'`)
			.join(", ");

		return `INSERT INTO ${this.#table} (${columns}) VALUES (${values})`;
	}
}
