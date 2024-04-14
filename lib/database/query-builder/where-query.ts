import { QueryElement } from "./query-element.js";
import { QueryVisitor } from "./query-visitor.js";

export class WhereQuery implements QueryElement {
  constructor(private readonly _condition = "") {}

  get condition() {
    return this._condition;
  }

  accept(visitor: QueryVisitor) {
    visitor.visitWhere(this);
  }
}
