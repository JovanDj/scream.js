import { FromQuery } from "./from-query.js";
import { QueryBuilder } from "./query-builder.js";
import { QueryElement } from "./query-element.js";
import { QueryVisitor } from "./query-visitor.js";
import { SelectQuery } from "./select-query.js";
import { WhereQuery } from "./where-query.js";

export class SqlQueryBuilder implements QueryBuilder {
  private _elements: QueryElement[] = [];

  constructor(private readonly _visitor: QueryVisitor) {}

  select(fields: string[]) {
    const select = new SelectQuery();
    fields.forEach((field) => select.addField(field));
    this._elements.push(select);
    return this;
  }

  from(table: string) {
    const from = new FromQuery();
    from.setTable(table);
    this._elements.push(from);
    return this;
  }

  where(condition: string) {
    const where = new WhereQuery();
    where.setCondition(condition);
    this._elements.push(where);
    return this;
  }

  build() {
    this._elements.forEach((element) => element.accept(this._visitor));

    const sql = this._visitor.getSql();
    this._elements = [];

    return sql;
  }
}
