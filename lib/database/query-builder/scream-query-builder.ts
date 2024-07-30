import { DeleteExpression } from "./expressions/delete-expression.js";
import { FromExpression } from "./expressions/from-expression.js";
import { GroupByExpression } from "./expressions/group-by-expression.js";
import { HavingExpression } from "./expressions/having-expression.js";
import { InsertExpression } from "./expressions/insert-expression.js";
import { JoinExpression } from "./expressions/join-expression.js";
import { LimitExpression } from "./expressions/limit-expression.js";
import { OffsetExpression } from "./expressions/offset-expression.js";
import { OrderByExpression } from "./expressions/order-by-expression.js";
import { SelectExpression } from "./expressions/select-expression.js";
import { UpdateExpression } from "./expressions/update-expression.js";
import { WhereExpression } from "./expressions/where-expression.js";
import { Join } from "./join.js";
import { SqlExpression } from "./sql-expression.js";

export class ScreamQueryBuilder {
  constructor(private readonly _expressions: readonly SqlExpression[] = []) {}

  select(fields = "*") {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new SelectExpression(fields),
    ]);
  }

  from(table: string) {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new FromExpression(table),
    ]);
  }

  where(condition: string) {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new WhereExpression(condition),
    ]);
  }

  orderBy(field: string, direction: "ASC" | "DESC" = "ASC") {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new OrderByExpression(field, direction),
    ]);
  }

  groupBy(fields: string) {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new GroupByExpression(fields),
    ]);
  }

  having(condition: string) {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new HavingExpression(condition),
    ]);
  }

  limit(limit: number) {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new LimitExpression(limit),
    ]);
  }

  offset(offset: number) {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new OffsetExpression(offset),
    ]);
  }

  join(table: string, condition: string, type: Join = "INNER") {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new JoinExpression(table, condition, type),
    ]);
  }

  insert(table: string, values: Record<string, number | string>) {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new InsertExpression(table, values),
    ]);
  }

  update(table: string, values: Record<string, number | string>) {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new UpdateExpression(table, values),
    ]);
  }

  delete(table: string) {
    return new ScreamQueryBuilder([
      ...this._expressions,
      new DeleteExpression(table),
    ]);
  }

  build() {
    return this._expressions
      .map((expression) => expression.interpret())
      .join(" ");
  }
}
