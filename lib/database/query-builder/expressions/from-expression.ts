import type { SqlExpression } from "../sql-expression.js";

export class FromExpression implements SqlExpression {
	constructor(private readonly _table: string) {}

	interpret() {
		return `FROM ${this._table}`;
	}
}
