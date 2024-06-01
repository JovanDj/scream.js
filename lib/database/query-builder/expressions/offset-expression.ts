import { SqlExpression } from "../sql-expression.js";

export class OffsetExpression implements SqlExpression {
  constructor(private readonly _offset: number) {}

  interpret() {
    return `OFFSET ${this._offset.toString()}`;
  }
}
