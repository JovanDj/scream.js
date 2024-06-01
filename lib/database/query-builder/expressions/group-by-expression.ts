import { SqlExpression } from "../sql-expression.js";

export class GroupByExpression implements SqlExpression {
  constructor(private readonly _fields: string) {}

  interpret() {
    return `GROUP BY ${this._fields}`;
  }
}
