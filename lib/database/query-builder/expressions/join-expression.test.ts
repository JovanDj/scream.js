import { describe, expect, it } from "vitest";
import { SqlExpression } from "../sql-expression.js";
import { JoinExpression } from "./join-expression.js";

describe("JoinExpression", () => {
  it("should form INNER JOIN expression", () => {
    const table = "orders";
    const condition = "users.id = orders.user_id";
    const joinExpression: SqlExpression = new JoinExpression(table, condition);

    expect(joinExpression.interpret()).toStrictEqual(
      "INNER JOIN orders ON users.id = orders.user_id",
    );
  });

  it("should form LEFT JOIN expression", () => {
    const table = "orders";
    const condition = "users.id = orders.user_id";
    const joinExpression: SqlExpression = new JoinExpression(
      table,
      condition,
      "LEFT",
    );

    expect(joinExpression.interpret()).toStrictEqual(
      "LEFT JOIN orders ON users.id = orders.user_id",
    );
  });
});
