import { FromQuery } from "./from-query.js";
import { SelectQuery } from "./select-query.js";
import { WhereQuery } from "./where-query.js";

export interface QueryVisitor {
  visitSelect(select: SelectQuery): void;
  visitFrom(from: FromQuery): void;
  visitWhere(where: WhereQuery): void;

  getSql(): string;
}
