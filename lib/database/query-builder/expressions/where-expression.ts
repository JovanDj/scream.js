import type { SqlExpression } from "../sql-expression.js";

export class WhereExpression implements SqlExpression {
	readonly #condition: string;
	readonly #operator: string;

	constructor(condition: string, operator: string) {
		this.#condition = condition;

		this.#operator = operator;
	}

	interpret() {
		return `WHERE ${this.#condition} ${this.#operator} ?`;
	}
}
