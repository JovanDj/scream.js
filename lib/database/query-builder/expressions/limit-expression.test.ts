import { describe, expect, it } from "vitest";
import { SqlExpression } from "../sql-expression.js";
import { LimitExpression } from "./limit-expression.js";

describe("LimitExpression", () => {
  it("should form LIMIT expression", () => {
    const limit = 10;
    const limitExpression: SqlExpression = new LimitExpression(limit);

    expect(limitExpression.interpret()).toStrictEqual("LIMIT 10");
  });
});
