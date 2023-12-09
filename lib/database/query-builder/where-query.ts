import { QueryElement } from "./query-element.js";
import { QueryVisitor } from "./query-visitor.js";

export class WhereQuery implements QueryElement {
  private _condition = "";

  setCondition(condition: string) {
    this._condition = condition;
  }

  getCondition() {
    return this._condition;
  }

  accept(visitor: QueryVisitor) {
    visitor.visitWhere(this);
  }
}
