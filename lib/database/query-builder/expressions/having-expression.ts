import type { SqlExpression } from "../sql-expression.js";

export class HavingExpression implements SqlExpression {
	readonly #condition: string;

	constructor(condition: string) {
		this.#condition = condition;
	}

	interpret() {
		return `HAVING ${this.#condition}`;
	}
}
