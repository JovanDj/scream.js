import { QueryVisitor } from "./query-visitor.js";

export interface QueryElement {
  accept(visitor: QueryVisitor): void;
}
