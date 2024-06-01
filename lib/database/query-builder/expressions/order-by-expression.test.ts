import { describe, expect, it } from "vitest";
import { SqlExpression } from "../sql-expression.js";
import { OrderByExpression } from "./order-by-expression.js";

describe("OrderByExpression", () => {
  it("should form ASC expression", () => {
    const field = "name";
    const directon: ConstructorParameters<typeof OrderByExpression>[1] = "ASC";

    const fromExpression: SqlExpression = new OrderByExpression(
      field,
      directon,
    );

    expect(fromExpression.interpret()).toStrictEqual("ORDER BY name ASC");
  });

  it("should form DESC expression", () => {
    const field = "name";
    const directon: ConstructorParameters<typeof OrderByExpression>[1] = "DESC";

    const fromExpression: SqlExpression = new OrderByExpression(
      field,
      directon,
    );

    expect(fromExpression.interpret()).toStrictEqual("ORDER BY name DESC");
  });

  it("should form ASC expression by default", () => {
    const field = "name";

    const fromExpression: SqlExpression = new OrderByExpression(field);

    expect(fromExpression.interpret()).toStrictEqual("ORDER BY name ASC");
  });
});
