import { QueryElement } from "./query-element.js";
import { QueryVisitor } from "./query-visitor.js";

export class OrderByQuery implements QueryElement {
  constructor(
    private readonly _fields: string[] = [],
    private readonly _order: "ASC" | "DESC" = "ASC"
  ) {}

  addField(field: string, order: "ASC" | "DESC" = "ASC") {
    return new OrderByQuery([...this._fields, field], order);
  }

  getFields() {
    return this._fields;
  }

  getOrder() {
    return this._order;
  }

  accept(visitor: QueryVisitor) {
    visitor.visitOrderBy(this);
  }
}
