import type { SqlExpression } from "../sql-expression.js";

export class LimitExpression implements SqlExpression {
	constructor(private readonly _limit: number) {}

	interpret() {
		return `LIMIT ${this._limit.toString()}`;
	}
}
