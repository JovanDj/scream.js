import type { SqlExpression } from "../sql-expression.js";

export class OrderByExpression implements SqlExpression {
	constructor(
		private readonly _field: string,
		private readonly _direction: "ASC" | "DESC" = "ASC",
	) {}

	interpret() {
		return `ORDER BY ${this._field} ${this._direction}`;
	}
}
