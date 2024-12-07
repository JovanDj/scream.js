import type { SqlExpression } from "../sql-expression.js";

export class SelectExpression implements SqlExpression {
	readonly #fields: string;

	constructor(fields = "*") {
		this.#fields = fields;
	}

	interpret() {
		return `SELECT ${this.#fields}`;
	}
}
