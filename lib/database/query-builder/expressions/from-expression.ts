import type { SqlExpression } from "../sql-expression.js";

export class FromExpression implements SqlExpression {
	readonly #table: string;

	constructor(table: string) {
		this.#table = table;
	}

	interpret() {
		return `FROM ${this.#table}`;
	}
}
