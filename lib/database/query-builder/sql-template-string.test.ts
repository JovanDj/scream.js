import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sql } from "./sql-template-string.js";

describe("SQL Template Literal Helper", { concurrency: true }, () => {
	it("should work with a simple query", () => {
		const query = sql`SELECT * FROM table`;
		assert.deepStrictEqual(query.sql, "SELECT * FROM table");
		assert.deepStrictEqual(query.params, []);
	});

	it("should work with a query with values", () => {
		const value = 1234;
		const query = sql`SELECT * FROM table WHERE column = ${value}`;
		assert.deepStrictEqual(query.sql, "SELECT * FROM table WHERE column = ?");
		assert.deepStrictEqual(query.params, [value]);
	});

	it("should work with falsy values", () => {
		const value1 = false;
		const value2 = null;
		const query = sql`SELECT * FROM table WHERE column1 = ${value1} AND column2 = ${value2}`;
		assert.deepStrictEqual(
			query.sql,
			"SELECT * FROM table WHERE column1 = ? AND column2 = ?",
		);
		assert.deepStrictEqual(query.params, [value1, value2]);
	});

	it("should work with an array parameter", () => {
		const ids = [1, 2, 3];
		const query = sql`SELECT * FROM table WHERE id IN (${ids})`;
		assert.deepStrictEqual(
			query.sql,
			"SELECT * FROM table WHERE id IN (?, ?, ?)",
		);
		assert.deepStrictEqual(query.params, ids);
	});

	it("should work with an empty array parameter", () => {
		const query = sql`SELECT * FROM table WHERE id IN (${[]})`;
		assert.deepStrictEqual(query.sql, "SELECT * FROM table WHERE id IN (?)");
		assert.deepStrictEqual(query.params, [null]);
	});

	it("should embed SQL in SQL", () => {
		const tableName = sql`books`;
		const query = sql`SELECT * FROM ${tableName}`;
		assert.deepStrictEqual(query.sql, "SELECT * FROM books");
		assert.deepStrictEqual(query.params, []);
	});

	it("should handle escaped backticks", () => {
		const query = sql`UPDATE user SET \`name\` = 'Taylor'`;
		assert.deepStrictEqual(query.sql, "UPDATE user SET `name` = 'Taylor'");
		assert.deepStrictEqual(query.params, []);
	});
});
