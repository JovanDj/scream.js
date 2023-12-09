import { QueryElement } from "./query-element.js";
import { QueryVisitor } from "./query-visitor.js";

export class SelectQuery implements QueryElement {
  private readonly _fields: string[] = [];

  addField(field: string) {
    this._fields.push(field);
  }

  getFields() {
    return this._fields;
  }

  accept(visitor: QueryVisitor) {
    visitor.visitSelect(this);
  }
}
