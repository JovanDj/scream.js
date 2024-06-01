import { describe, expect, it } from "vitest";
import { SqlExpression } from "../sql-expression.js";
import { GroupByExpression } from "./group-by-expression.js";

describe("GroupByExpression", () => {
  it("should form GROUP BY expression", () => {
    const fields = "age";
    const groupByExpression: SqlExpression = new GroupByExpression(fields);

    expect(groupByExpression.interpret()).toStrictEqual("GROUP BY age");
  });
});
