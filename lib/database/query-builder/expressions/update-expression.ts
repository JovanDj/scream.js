import type { SqlExpression } from "../sql-expression.js";

export class UpdateExpression implements SqlExpression {
	readonly #table: string;
	readonly #fields: readonly string[];

	constructor(table: string, fields: readonly string[]) {
		this.#table = table;
		this.#fields = fields;
	}

	interpret() {
		const updates = this.#fields.map((field) => `${field} = ?`).join(", ");

		return `UPDATE ${this.#table} SET ${updates}`;
	}
}
