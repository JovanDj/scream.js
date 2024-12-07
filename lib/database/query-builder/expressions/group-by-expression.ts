import type { SqlExpression } from "../sql-expression.js";

export class GroupByExpression implements SqlExpression {
	readonly #fields: string;

	constructor(fields: string) {
		this.#fields = fields;
	}

	interpret() {
		return `GROUP BY ${this.#fields}`;
	}
}
