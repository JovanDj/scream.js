import { FromQuery } from "./from-query.js";
import { OrderByQuery } from "./order-by-query.js";
import { QueryBuilder } from "./query-builder.js";
import { QueryElement } from "./query-element.js";
import { QueryVisitor } from "./query-visitor.js";
import { SelectQuery } from "./select-query.js";
import { WhereQuery } from "./where-query.js";

export class SqlQueryBuilder implements QueryBuilder {
  constructor(
    private readonly _visitor: QueryVisitor,
    private readonly _elements: QueryElement[] = []
  ) {}

  select(fields: string[]) {
    let select = new SelectQuery();

    fields.forEach((field) => {
      select = select.addField(field);
    });

    return new SqlQueryBuilder(this._visitor, [...this._elements, select]);
  }

  from(table: string) {
    const from = new FromQuery(table);
    return new SqlQueryBuilder(this._visitor, [...this._elements, from]);
  }

  where(condition: string) {
    const where = new WhereQuery(condition);
    return new SqlQueryBuilder(this._visitor, [...this._elements, where]);
  }

  orderBy(fields: string[], order: "ASC" | "DESC" = "ASC") {
    const orderBy = new OrderByQuery(fields, order);
    return new SqlQueryBuilder(this._visitor, [...this._elements, orderBy]);
  }

  build() {
    this._elements.forEach((element) => element.accept(this._visitor));
    return this._visitor.getSql();
  }
}
