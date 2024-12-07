import type { SqlExpression } from "../sql-expression.js";

export class UpdateExpression implements SqlExpression {
	readonly #table: string;
	readonly #values: Record<string, number | string>;

	constructor(table: string, values: Record<string, number | string>) {
		this.#table = table;
		this.#values = values;
	}

	interpret() {
		const updates = Object.entries(this.#values)
			.map(([key, value]) => `${key}='${value}'`)
			.join(", ");

		return `UPDATE ${this.#table} SET ${updates}`;
	}
}
