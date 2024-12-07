import type { SqlExpression } from "../sql-expression.js";

export class DeleteExpression implements SqlExpression {
	readonly #table: string;

	constructor(table: string) {
		this.#table = table;
	}

	interpret() {
		return `DELETE FROM ${this.#table}`;
	}
}
