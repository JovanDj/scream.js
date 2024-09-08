import { describe, expect, it } from "vitest";
import { ScreamQueryBuilder } from "./scream-query-builder.js";

describe("ScreamQueryBuilder", () => {
	it("should build a SELECT query", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.select("*").build();
		expect(sql).toBe("SELECT *");
	});

	it("should build a SELECT query with FROM clause", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.select("*").from("users").build();
		expect(sql).toBe("SELECT * FROM users");
	});

	it("should build a SELECT query with WHERE clause", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.select("*").from("users").where("id = 1").build();
		expect(sql).toBe("SELECT * FROM users WHERE id = 1");
	});

	it("should build a SELECT query with ORDER BY clause", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder
			.select("*")
			.from("users")
			.orderBy("name", "DESC")
			.build();
		expect(sql).toBe("SELECT * FROM users ORDER BY name DESC");
	});

	it("should build a SELECT query with GROUP BY clause", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.select("*").from("users").groupBy("age").build();
		expect(sql).toBe("SELECT * FROM users GROUP BY age");
	});

	it("should build a SELECT query with HAVING clause", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder
			.select("*")
			.from("users")
			.groupBy("age")
			.having("COUNT(*) > 1")
			.build();
		expect(sql).toBe("SELECT * FROM users GROUP BY age HAVING COUNT(*) > 1");
	});

	it("should build a SELECT query with LIMIT clause", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.select("*").from("users").limit(10).build();
		expect(sql).toBe("SELECT * FROM users LIMIT 10");
	});

	it("should build a SELECT query with OFFSET clause", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.select("*").from("users").limit(10).offset(5).build();
		expect(sql).toBe("SELECT * FROM users LIMIT 10 OFFSET 5");
	});

	it("should build a SELECT query with JOIN clause", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder
			.select("*")
			.from("users")
			.join("orders", "users.id = orders.user_id")
			.build();
		expect(sql).toBe(
			"SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id",
		);
	});

	it("should build an INSERT query", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.insert("users", { id: 1, name: "Alice" }).build();
		expect(sql).toBe("INSERT INTO users (id, name) VALUES ('1', 'Alice')");
	});

	it("should build an UPDATE query", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.update("users", { name: "Alice", age: 30 }).build();
		expect(sql).toBe("UPDATE users SET name='Alice', age='30'");
	});

	it("should build a DELETE query", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.delete("users").build();
		expect(sql).toBe("DELETE FROM users");
	});

	// Additional Tests for Complex Queries and Edge Cases
	it("should build a complex query with multiple clauses", () => {
		const builder = new ScreamQueryBuilder();
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

		expect(sql).toBe(
			"SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id WHERE users.age > 21 GROUP BY users.age HAVING COUNT(orders.id) > 5 ORDER BY users.name ASC LIMIT 10 OFFSET 20",
		);
	});

	it("should handle empty string in SELECT fields", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.select("").from("users").build();
		expect(sql).toBe("SELECT  FROM users");
	});

	it("should handle special characters in table and column names", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.select("name, age").from("user's_data").build();
		expect(sql).toBe("SELECT name, age FROM user's_data");
	});

	it("should handle SQL keywords in table and column names", () => {
		const builder = new ScreamQueryBuilder();
		const sql = builder.select("select, from").from("table").build();
		expect(sql).toBe("SELECT select, from FROM table");
	});
});
