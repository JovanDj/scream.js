import { QueryElement } from "./query-element.js";
import { QueryVisitor } from "./query-visitor.js";

export class FromQuery implements QueryElement {
  private _table = "";

  setTable(table: string) {
    this._table = table;
  }

  getTable() {
    return this._table;
  }

  accept(visitor: QueryVisitor) {
    visitor.visitFrom(this);
  }
}
