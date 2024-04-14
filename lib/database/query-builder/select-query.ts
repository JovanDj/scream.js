import { QueryElement } from "./query-element.js";
import { QueryVisitor } from "./query-visitor.js";

export class SelectQuery implements QueryElement {
  constructor(private readonly _fields: string[] = []) {}

  addField(field: string) {
    return new SelectQuery([...this._fields, field]);
  }

  getFields() {
    return [...this._fields];
  }

  accept(visitor: QueryVisitor) {
    visitor.visitSelect(this);
  }
}
