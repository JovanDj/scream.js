import { SqlExpression } from "../sql-expression.js";

export class InsertExpression implements SqlExpression {
  constructor(
    private readonly _table: string,
    private readonly _values: Record<string, number | string>,
  ) {}

  interpret() {
    const columns = Object.keys(this._values).join(", ");
    const values = Object.values(this._values)
      .map((value) => `'${value.toString()}'`)
      .join(", ");
    return `INSERT INTO ${this._table} (${columns}) VALUES (${values})`;
  }
}
