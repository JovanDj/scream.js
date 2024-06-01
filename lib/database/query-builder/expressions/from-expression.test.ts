import { describe, expect, it } from "vitest";
import { SqlExpression } from "../sql-expression.js";
import { FromExpression } from "./from-expression.js";

describe("FromExpression", () => {
  it("should form FROM expression", () => {
    const table = "users";
    const fromExpression: SqlExpression = new FromExpression(table);

    expect(fromExpression.interpret()).toStrictEqual("FROM users");
  });
});
