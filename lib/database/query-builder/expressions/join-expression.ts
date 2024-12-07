import type { Join } from "../join.js";
import type { SqlExpression } from "../sql-expression.js";

export class JoinExpression implements SqlExpression {
	readonly #table: string;
	readonly #condition: string;
	readonly #type: Join;

	constructor(table: string, condition: string, type: Join = "INNER") {
		this.#table = table;
		this.#condition = condition;
		this.#type = type;
	}

	interpret() {
		return `${this.#type} JOIN ${this.#table} ON ${this.#condition}`;
	}
}
