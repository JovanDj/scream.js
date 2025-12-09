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

	it("should throw on empty array parameters", (t: TestContext) => {
		t.plan(1);

		t.assert.throws(
			() => {
				sql`SELECT * FROM table WHERE id IN (${[]})`;
			},
			{
				message:
					"sql: empty array interpolation is not allowed; handle this at call site",
				name: "Error",
			},
		);
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

	it("should ignore undefined interpolations", (t: TestContext) => {
		t.plan(2);
		const maybeFilter = undefined;
		const query = sql`SELECT * FROM users WHERE 1 = 1 ${maybeFilter}`;
		t.assert.deepStrictEqual(query.sql, "SELECT * FROM users WHERE 1 = 1 ");
		t.assert.deepStrictEqual(query.params, []);
	});

	it("should embed a parameterized SQL fragment", (t: TestContext) => {
		t.plan(2);
		const where = sql`WHERE id IN (${[1, 2]})`;
		const query = sql`SELECT * FROM users ${where} AND active = ${true}`;

		t.assert.deepStrictEqual(
			query.sql,
			"SELECT * FROM users WHERE id IN (?, ?) AND active = ?",
		);
		t.assert.deepStrictEqual(query.params, [1, 2, true]);
	});

	it("should not mutate array parameters", (t: TestContext) => {
		t.plan(2);
		const ids = [1, 2, 3];
		const original = [...ids];

		const query = sql`SELECT * FROM table WHERE id IN (${ids})`;

		t.assert.deepStrictEqual(query.params, ids);
		t.assert.deepStrictEqual(ids, original);
	});

	it("should treat 0 and empty string as valid params", (t: TestContext) => {
		t.plan(2);
		const zero = 0;
		const empty = "";
		const query = sql`SELECT * FROM users WHERE attempts = ${zero} AND nickname = ${empty}`;

		t.assert.deepStrictEqual(
			query.sql,
			"SELECT * FROM users WHERE attempts = ? AND nickname = ?",
		);
		t.assert.deepStrictEqual(query.params, [zero, empty]);
	});

	it("should not append placeholders for undefined between fragments", (t: TestContext) => {
		t.plan(2);
		const filter = undefined;
		const whereBase = sql`WHERE 1 = 1`;
		const query = sql`SELECT * FROM users ${whereBase} ${filter}`;

		t.assert.deepStrictEqual(query.sql, "SELECT * FROM users WHERE 1 = 1 ");
		t.assert.deepStrictEqual(query.params, []);
	});

	it("should preserve parameter order with many array values", (t: TestContext) => {
		t.plan(2);
		const ids = Array.from({ length: 10 }, (_, i) => i + 1);
		const query = sql`SELECT * FROM table WHERE id IN (${ids})`;

		// 10 placeholders
		t.assert.deepStrictEqual(
			query.sql,
			"SELECT * FROM table WHERE id IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		);
		// 10 params in the same order
		t.assert.deepStrictEqual(query.params, ids);
	});

	it("should allow mixing scalar, array, and fragment in a single query", (t: TestContext) => {
		t.plan(2);
		const ids = [1, 2];
		const active = true;
		const base = sql`WHERE id IN (${ids})`;
		const query = sql`SELECT * FROM users ${base} AND active = ${active}`;

		t.assert.deepStrictEqual(
			query.sql,
			"SELECT * FROM users WHERE id IN (?, ?) AND active = ?",
		);
		t.assert.deepStrictEqual(query.params, [1, 2, active]);
	});

	it("should flatten params from multiple embedded fragments in order", (t: TestContext) => {
		t.plan(2);

		const whereIds = sql`WHERE id IN (${[1, 2]})`;
		const andActive = sql`AND active = ${true}`;
		const query = sql`SELECT * FROM users ${whereIds} ${andActive} AND role = ${"admin"}`;

		t.assert.deepStrictEqual(
			query.sql,
			"SELECT * FROM users WHERE id IN (?, ?) AND active = ? AND role = ?",
		);
		t.assert.deepStrictEqual(query.params, [1, 2, true, "admin"]);
	});
});
