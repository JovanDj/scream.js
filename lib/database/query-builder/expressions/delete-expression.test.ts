import { describe, expect, it } from "vitest";
import { SqlExpression } from "../sql-expression.js";
import { DeleteExpression } from "./delete-expression.js";
describe("DeleteExpression", () => {
  it("should form DELETE FROM expression", () => {
    const table = "users";
    const deleteExpression: SqlExpression = new DeleteExpression(table);

    expect(deleteExpression.interpret()).toStrictEqual("DELETE FROM users");
  });
});
