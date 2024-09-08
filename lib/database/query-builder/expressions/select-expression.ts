import type { SqlExpression } from "../sql-expression.js";

export class SelectExpression implements SqlExpression {
	constructor(private readonly _fields = "*") {}

	interpret() {
		return `SELECT ${this._fields}`;
	}
}
