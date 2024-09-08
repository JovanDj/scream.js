import type { SqlExpression } from "../sql-expression.js";

export class UpdateExpression implements SqlExpression {
	constructor(
		private readonly _table: string,
		private readonly _values: Record<string, number | string>,
	) {}

	interpret() {
		const updates = Object.entries(this._values)
			.map(([key, value]) => `${key}='${value.toString()}'`)
			.join(", ");
		return `UPDATE ${this._table} SET ${updates}`;
	}
}
