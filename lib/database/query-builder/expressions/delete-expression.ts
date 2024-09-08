import type { SqlExpression } from "../sql-expression.js";

export class DeleteExpression implements SqlExpression {
	constructor(private readonly _table: string) {}

	interpret() {
		return `DELETE FROM ${this._table}`;
	}
}
