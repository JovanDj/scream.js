import { describe, it, type TestContext } from "node:test";
import { sql } from "./sql-template-string.js";

describe("SQL Template Literal Helper", { concurrency: true }, () => {
	it("should work with a simple query", (t: TestContext) => {
		t.plan(2);
		const query = sql`SELECT * FROM table`;
		t.assert.deepStrictEqual(query.sql, "SELECT * FROM table");
		t.assert.deepStrictEqual(query.params, []);
	});

	it("should work with a query with values", (t: TestContext) => {
		t.plan(2);
		const value = 1234;
		const query = sql`SELECT * FROM table WHERE column = ${value}`;
		t.assert.deepStrictEqual(query.sql, "SELECT * FROM table WHERE column = ?");
		t.assert.deepStrictEqual(query.params, [value]);
	});

	it("should work with falsy values", (t: TestContext) => {
		t.plan(2);
		const value1 = false;
		const value2 = null;
		const query = sql`SELECT * FROM table WHERE column1 = ${value1} AND column2 = ${value2}`;
		t.assert.deepStrictEqual(
			query.sql,
			"SELECT * FROM table WHERE column1 = ? AND column2 = ?",
		);
		t.assert.deepStrictEqual(query.params, [value1, value2]);
	});

	it("should work with an array parameter", (t: TestContext) => {
		t.plan(2);
		const ids = [1, 2, 3];
		const query = sql`SELECT * FROM table WHERE id IN (${ids})`;
		t.assert.deepStrictEqual(
			query.sql,
			"SELECT * FROM table WHERE id IN (?, ?, ?)",
		);
		t.assert.deepStrictEqual(query.params, ids);
	});

	it("should work with an empty array parameter", (t: TestContext) => {
		t.plan(2);
		const query = sql`SELECT * FROM table WHERE id IN (${[]})`;
		t.assert.deepStrictEqual(query.sql, "SELECT * FROM table WHERE id IN (?)");
		t.assert.deepStrictEqual(query.params, [null]);
	});

	it("should embed SQL in SQL", (t: TestContext) => {
		t.plan(2);
		const tableName = sql`books`;
		const query = sql`SELECT * FROM ${tableName}`;
		t.assert.deepStrictEqual(query.sql, "SELECT * FROM books");
		t.assert.deepStrictEqual(query.params, []);
	});

	it("should handle escaped backticks", (t: TestContext) => {
		t.plan(2);
		const query = sql`UPDATE user SET \`name\` = 'Taylor'`;
		t.assert.deepStrictEqual(query.sql, "UPDATE user SET `name` = 'Taylor'");
		t.assert.deepStrictEqual(query.params, []);
	});
});
