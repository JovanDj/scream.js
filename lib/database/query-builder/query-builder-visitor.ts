import { FromQuery } from "./from-query.js";
import { OrderByQuery } from "./order-by-query.js";
import { QueryVisitor } from "./query-visitor.js";
import { SelectQuery } from "./select-query.js";
import { WhereQuery } from "./where-query.js";

export class SqlQueryVisitor implements QueryVisitor {
  private _sql = "";

  visitSelect(select: SelectQuery) {
    this._sql += "SELECT " + select.getFields().join(", ") + " ";
  }

  visitFrom(from: FromQuery) {
    this._sql += "FROM " + from.getTable() + " ";
  }

  visitWhere(where: WhereQuery) {
    this._sql += "WHERE " + where.condition + " ";
  }

  visitOrderBy(orderBy: OrderByQuery) {
    this._sql +=
      "ORDER BY " +
      orderBy.getFields().join(", ") +
      " " +
      orderBy.getOrder() +
      " ";
  }

  getSql() {
    const sql = this._sql.trim() + ";";
    this._sql = "";
    return sql;
  }
}
