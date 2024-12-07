import type { SqlExpression } from "../sql-expression.js";

export class OffsetExpression implements SqlExpression {
	readonly #offset: number;

	constructor(offset: number) {
		this.#offset = offset;
	}

	interpret() {
		return `OFFSET ${this.#offset}`;
	}
}
