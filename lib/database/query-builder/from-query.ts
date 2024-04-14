import { QueryElement } from "./query-element.js";
import { QueryVisitor } from "./query-visitor.js";

export class FromQuery implements QueryElement {
  constructor(private readonly _table = "") {}

  getTable() {
    return this._table;
  }

  accept(visitor: QueryVisitor) {
    visitor.visitFrom(this);
  }
}
