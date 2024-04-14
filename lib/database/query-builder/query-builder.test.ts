import { describe, expect, it } from "vitest";
import { SqlQueryVisitor } from "./query-builder-visitor.js";
import { SqlQueryBuilder } from "./scream-query-builder.js";

describe("ScreamQueryBuilder", () => {
  it("should build a query for SELECT * FROM users", () => {
    const builder = new SqlQueryBuilder(new SqlQueryVisitor());
    const query = builder.select(["*"]).from("users").build();

    expect(query).toStrictEqual("SELECT * FROM users;");
  });

  it("should build a query with SELECT and FROM clauses", () => {
    const builder = new SqlQueryBuilder(new SqlQueryVisitor());
    const query = builder.select(["id", "name"]).from("users").build();

    expect(query).toStrictEqual("SELECT id, name FROM users;");
  });

  it("should correctly build a query with SELECT, FROM, WHERE, and ORDER BY clauses", () => {
    const builder = new SqlQueryBuilder(new SqlQueryVisitor());
    const query = builder
      .select(["id", "username"])
      .from("users")
      .where("active = 1")
      .orderBy(["username"], "ASC")
      .build();

    expect(query).toStrictEqual(
      "SELECT id, username FROM users WHERE active = 1 ORDER BY username ASC;"
    );
  });
});
