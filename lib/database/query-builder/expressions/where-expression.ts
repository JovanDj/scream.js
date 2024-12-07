import type { SqlExpression } from "../sql-expression.js";

export class WhereExpression implements SqlExpression {
	readonly #condition: string;

	constructor(condition: string) {
		this.#condition = condition;
	}

	interpret() {
		return `WHERE ${this.#condition}`;
	}
}
