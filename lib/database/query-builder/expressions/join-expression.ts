import type { Join } from "../join.js";
import type { SqlExpression } from "../sql-expression.js";

export class JoinExpression implements SqlExpression {
	constructor(
		private readonly _table: string,
		private readonly _condition: string,
		private readonly _type: Join = "INNER",
	) {}

	interpret() {
		return `${this._type} JOIN ${this._table} ON ${this._condition}`;
	}
}
