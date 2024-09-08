import type { SqlExpression } from "../sql-expression.js";

export class HavingExpression implements SqlExpression {
	constructor(private readonly _condition: string) {}

	interpret() {
		return `HAVING ${this._condition}`;
	}
}
