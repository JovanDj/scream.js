import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { ScreamQueryBuilder } from "./scream-query-builder.js";

describe("ScreamQueryBuilder", () => {
	let builder: ScreamQueryBuilder;

	beforeEach(() => {
		builder = new ScreamQueryBuilder();
	});

	it("should build a SELECT query", () => {
		const sql = builder.select("1 + 1").build();

		assert.deepStrictEqual(sql, "SELECT 1 + 1");
	});

	it("should build a SELECT query with FROM clause", () => {
		const sql = builder.select("*").from("users").build();

		assert.deepStrictEqual(sql, "SELECT * FROM users");
	});

	it("should build a SELECT query with WHERE clause", () => {
		const sql = builder.select("*").from("users").where("id = 1").build();

		assert.deepStrictEqual(sql, "SELECT * FROM users WHERE id = 1");
	});

	it("should build a SELECT query with ORDER BY clause", () => {
		const sql = builder
			.select("*")
			.from("users")
			.orderBy("name", "DESC")
			.build();

		assert.deepStrictEqual(sql, "SELECT * FROM users ORDER BY name DESC");
	});

	it("should build a SELECT query with GROUP BY clause", () => {
		const sql = builder.select("*").from("users").groupBy("age").build();

		assert.deepStrictEqual(sql, "SELECT * FROM users GROUP BY age");
	});

	it("should build a SELECT query with HAVING clause", () => {
		const sql = builder
			.select("*")
			.from("users")
			.groupBy("age")
			.having("COUNT(*) > 1")
			.build();

		assert.deepStrictEqual(
			sql,
			"SELECT * FROM users GROUP BY age HAVING COUNT(*) > 1",
		);
	});

	it("should build a SELECT query with LIMIT clause", () => {
		const sql = builder.select("*").from("users").limit(10).build();

		assert.deepStrictEqual(sql, "SELECT * FROM users LIMIT 10");
	});

	it("should build a SELECT query with OFFSET clause", () => {
		const sql = builder.select("*").from("users").limit(10).offset(5).build();

		assert.deepStrictEqual(sql, "SELECT * FROM users LIMIT 10 OFFSET 5");
	});

	it("should build a SELECT query with JOIN clause", () => {
		const sql = builder
			.select("*")
			.from("users")
			.join("orders", "users.id = orders.user_id")
			.build();

		assert.deepStrictEqual(
			sql,
			"SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id",
		);
	});

	it("should build an INSERT query", () => {
		const sql = builder.insert("users", { id: 1, name: "Alice" }).build();

		assert.deepStrictEqual(
			sql,
			"INSERT INTO users (id, name) VALUES ('1', 'Alice')",
		);
	});

	it("should build an UPDATE query", () => {
		const sql = builder.update("users", { name: "Alice", age: 30 }).build();

		assert.deepStrictEqual(sql, "UPDATE users SET name='Alice', age='30'");
	});

	it("should build a DELETE query", () => {
		const sql = builder.delete("users").build();

		assert.deepStrictEqual(sql, "DELETE FROM users");
	});

	it("should build a complex query with multiple clauses", () => {
		const sql = builder
			.select("*")
			.from("users")
			.join("orders", "users.id = orders.user_id")
			.where("users.age > 21")
			.groupBy("users.age")
			.having("COUNT(orders.id) > 5")
			.orderBy("users.name", "ASC")
			.limit(10)
			.offset(20)
			.build();

		assert.deepStrictEqual(
			sql,
			"SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id WHERE users.age > 21 GROUP BY users.age HAVING COUNT(orders.id) > 5 ORDER BY users.name ASC LIMIT 10 OFFSET 20",
		);
	});

	it("should handle empty string in SELECT fields", () => {
		const sql = builder.select("").from("users").build();

		assert.deepStrictEqual(sql, "SELECT  FROM users");
	});

	it("should handle special characters in table and column names", () => {
		const sql = builder.select("name, age").from("user's_data").build();

		assert.deepStrictEqual(sql, "SELECT name, age FROM user's_data");
	});

	it("should handle SQL keywords in table and column names", () => {
		const sql = builder.select("select, from").from("table").build();

		assert.deepStrictEqual(sql, "SELECT select, from FROM table");
	});
});
