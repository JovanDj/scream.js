import type { SqlExpression } from "../sql-expression.js";

export class OrderByExpression implements SqlExpression {
	readonly #field: string;
	readonly #direction: "ASC" | "DESC";

	constructor(field: string, direction: "ASC" | "DESC" = "ASC") {
		this.#field = field;
		this.#direction = direction;
	}

	interpret() {
		return `ORDER BY ${this.#field} ${this.#direction}`;
	}
}
