import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { ScreamQueryBuilder } from "./scream-query-builder.js";

describe("ScreamQueryBuilder", { concurrency: true }, () => {
	let builder: ScreamQueryBuilder;

	beforeEach(() => {
		builder = new ScreamQueryBuilder();
	});

	it("should build a SELECT query", () => {
		const query = builder.select("1 + 1").build();
		assert.deepStrictEqual(query, { sql: "SELECT 1 + 1", params: [] });
	});

	it("should build a SELECT query with FROM clause", () => {
		const query = builder.select("*").from("users").build();
		assert.deepStrictEqual(query, { sql: "SELECT * FROM users", params: [] });
	});

	it("should build a SELECT query with WHERE clause", () => {
		const query = builder
			.select("*")
			.from("users")
			.where("id", "=", "1")
			.build();

		assert.deepStrictEqual(query, {
			sql: "SELECT * FROM users WHERE id = ?",
			params: ["1"],
		});
	});

	it("should build a SELECT query with ORDER BY clause", () => {
		const query = builder
			.select("*")
			.from("users")
			.orderBy("name", "DESC")
			.build();

		assert.deepStrictEqual(query, {
			sql: "SELECT * FROM users ORDER BY name DESC",
			params: [],
		});
	});

	it("should build a SELECT query with GROUP BY clause", () => {
		const query = builder.select("*").from("users").groupBy("age").build();

		assert.deepStrictEqual(query, {
			sql: "SELECT * FROM users GROUP BY age",
			params: [],
		});
	});

	it("should build a SELECT query with HAVING clause", () => {
		const query = builder
			.select("*")
			.from("users")
			.groupBy("age")
			.having("COUNT(*)", ">", "1")
			.build();

		assert.deepStrictEqual(query, {
			sql: "SELECT * FROM users GROUP BY age HAVING COUNT(*) > ?",
			params: ["1"],
		});
	});

	it("should build a SELECT query with LIMIT clause", () => {
		const query = builder.select("*").from("users").limit(10).build();

		assert.deepStrictEqual(query, {
			sql: "SELECT * FROM users LIMIT 10",
			params: [],
		});
	});

	it("should build a SELECT query with OFFSET clause", () => {
		const query = builder.select("*").from("users").limit(10).offset(5).build();

		assert.deepStrictEqual(query, {
			sql: "SELECT * FROM users LIMIT 10 OFFSET 5",
			params: [],
		});
	});

	it("should build a SELECT query with JOIN clause", () => {
		const query = builder
			.select("*")
			.from("users")
			.join("orders", "users.id = orders.user_id")
			.build();

		assert.deepStrictEqual(query, {
			sql: "SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id",
			params: [],
		});
	});

	it("should build an INSERT query", () => {
		const query = builder.insert("users", { id: 1, name: "Alice" }).build();

		assert.deepStrictEqual(query, {
			sql: "INSERT INTO users (id, name) VALUES ('1', 'Alice')",
			params: [],
		});
	});

	it("should build an UPDATE query", () => {
		const query = builder.update("users", { name: "Alice", age: 30 }).build();

		assert.deepStrictEqual(query, {
			sql: "UPDATE users SET name='Alice', age='30'",
			params: [],
		});
	});

	it("should build a DELETE query", () => {
		const query = builder.delete("users").build();

		assert.deepStrictEqual(query, { sql: "DELETE FROM users", params: [] });
	});

	it("should build a complex query with multiple clauses", () => {
		const query = builder
			.select("*")
			.from("users")
			.join("orders", "users.id = orders.user_id")
			.where("users.age", ">", "21")
			.groupBy("users.age")
			.having("COUNT(orders.id)", ">", "5")
			.orderBy("users.name", "ASC")
			.limit(10)
			.offset(20)
			.build();

		assert.deepStrictEqual(query, {
			sql: "SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id WHERE users.age > ? GROUP BY users.age HAVING COUNT(orders.id) > ? ORDER BY users.name ASC LIMIT 10 OFFSET 20",
			params: ["21", "5"],
		});
	});

	it("should handle empty string in SELECT fields", () => {
		const query = builder.select("").from("users").build();
		assert.deepStrictEqual(query, { sql: "SELECT  FROM users", params: [] });
	});

	it("should handle special characters in table and column names", () => {
		const query = builder.select("name, age").from("user's_data").build();

		assert.deepStrictEqual(query, {
			sql: "SELECT name, age FROM user's_data",
			params: [],
		});
	});

	it("should handle SQL keywords in table and column names", () => {
		const query = builder.select("select, from").from("table").build();

		assert.deepStrictEqual(query, {
			sql: "SELECT select, from FROM table",
			params: [],
		});
	});

	it("should preserve params across join", () => {
		const query = builder
			.select("*")
			.from("users")
			.where("id", "=", "123")
			.join("orders", "users.id = orders.user_id")
			.build();

		assert.deepStrictEqual(query.params, ["123"]);
	});
});
