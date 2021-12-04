import { QueryBuilder } from "../query-builder";
import { ScreamQueryBuilder } from "../scream-query-builder";

describe("ScreamQueryBuilder", () => {
  let queryBuilder: QueryBuilder;

  beforeEach(() => {
    queryBuilder = new ScreamQueryBuilder();
  });

  it("should be defined", () => {
    expect(queryBuilder).toBeInstanceOf(ScreamQueryBuilder);
  });

  describe("select", () => {
    it("should select all fields", () => {
      expect(queryBuilder.select().getRawSql()).toEqual("SELECT *");
    });

    it("should select given field", () => {
      expect(queryBuilder.select(["name"]).getRawSql()).toEqual("SELECT name");
    });

    it("should select all given fields", () => {
      expect(
        queryBuilder.select(["firstName", "lastName"]).getRawSql()
      ).toEqual("SELECT firstName lastName");
    });

    it("should select a table", () => {
      const query = queryBuilder
        .select(["first_name", "last_name"])
        .from("table_name")
        .getRawSql();

      expect(query).toEqual("SELECT first_name last_name FROM table_name");
    });
  });
});
