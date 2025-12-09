import type { SqlExpression } from "../sql-expression.js";

export class WhereExpression implements SqlExpression {
	readonly #condition: string;
	readonly #operator: string;
	readonly #conjunction: "WHERE" | "AND";

	constructor(
		condition: string,
		operator: string,
		conjunction: "WHERE" | "AND" = "WHERE",
	) {
		this.#condition = condition;
		this.#operator = operator;
		this.#conjunction = conjunction;
	}

	interpret() {
		return `${this.#conjunction} ${this.#condition} ${this.#operator} ?`;
	}
}
