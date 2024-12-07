import type { SqlExpression } from "../sql-expression.js";

export class LimitExpression implements SqlExpression {
	readonly #limit: number;

	constructor(limit: number) {
		this.#limit = limit;
	}

	interpret() {
		return `LIMIT ${this.#limit.toString()}`;
	}
}
