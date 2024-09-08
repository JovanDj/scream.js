import type { SqlExpression } from "../sql-expression.js";

export class WhereExpression implements SqlExpression {
	constructor(private readonly _condition: string) {}

	interpret() {
		return `WHERE ${this._condition}`;
	}
}
