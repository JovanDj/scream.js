import { describe, it, type TestContext } from "node:test";
import { FromExpression } from "./expressions/from-expression.js";
import { WhereExpression } from "./expressions/where-expression.js";
import { ScreamQueryBuilder } from "./scream-query-builder.js";

describe("ScreamQueryBuilder", { concurrency: true }, () => {
	describe("select", () => {
		it("should build a SELECT query", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder.select("1 + 1").build();
			t.assert.deepStrictEqual(query, { params: [], sql: "SELECT 1 + 1" });
		});

		it("should build a SELECT query with FROM clause", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder.select("*").from("users").build();
			t.assert.deepStrictEqual(query, {
				params: [],
				sql: "SELECT * FROM users",
			});
		});

		it("should build a SELECT query with WHERE clause", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder
				.select("*")
				.from("users")
				.where("id", "=", "1")
				.build();

			t.assert.deepStrictEqual(query, {
				params: ["1"],
				sql: "SELECT * FROM users WHERE id = ?",
			});
		});

		it("should build a SELECT query with ORDER BY clause", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder
				.select("*")
				.from("users")
				.orderBy("name", "DESC")
				.build();

			t.assert.deepStrictEqual(query, {
				params: [],
				sql: "SELECT * FROM users ORDER BY name DESC",
			});
		});

		it("should build a SELECT query with GROUP BY clause", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder.select("*").from("users").groupBy("age").build();

			t.assert.deepStrictEqual(query, {
				params: [],
				sql: "SELECT * FROM users GROUP BY age",
			});
		});

		it("should build a SELECT query with HAVING clause", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder
				.select("*")
				.from("users")
				.groupBy("age")
				.having("COUNT(*)", ">", "1")
				.build();

			t.assert.deepStrictEqual(query, {
				params: ["1"],
				sql: "SELECT * FROM users GROUP BY age HAVING COUNT(*) > ?",
			});
		});

		it("should build a SELECT query with LIMIT clause", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder.select("*").from("users").limit(10).build();

			t.assert.deepStrictEqual(query, {
				params: [],
				sql: "SELECT * FROM users LIMIT 10",
			});
		});

		it("should build a SELECT query with OFFSET clause", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder
				.select("*")
				.from("users")
				.limit(10)
				.offset(5)
				.build();

			t.assert.deepStrictEqual(query, {
				params: [],
				sql: "SELECT * FROM users LIMIT 10 OFFSET 5",
			});
		});

		it("should build a SELECT query with JOIN clause", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder
				.select("*")
				.from("users")
				.join("orders", "users.id = orders.user_id")
				.build();

			t.assert.deepStrictEqual(query, {
				params: [],
				sql: "SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id",
			});
		});

		it("should build a complex query with multiple clauses", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
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

			t.assert.deepStrictEqual(query, {
				params: ["21", "5"],
				sql: "SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id WHERE users.age > ? GROUP BY users.age HAVING COUNT(orders.id) > ? ORDER BY users.name ASC LIMIT 10 OFFSET 20",
			});
		});

		it("should handle empty string in SELECT fields", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder.select("").from("users").build();
			t.assert.deepStrictEqual(query, {
				params: [],
				sql: "SELECT  FROM users",
			});
		});

		it("should handle special characters in table and column names", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder.select("name, age").from("user's_data").build();

			t.assert.deepStrictEqual(query, {
				params: [],
				sql: "SELECT name, age FROM user's_data",
			});
		});

		it("should handle SQL keywords in table and column names", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder.select("select, from").from("table").build();

			t.assert.deepStrictEqual(query, {
				params: [],
				sql: "SELECT select, from FROM table",
			});
		});

		it("should chain multiple WHERE clauses with AND and preserve param order", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();

			const query = builder
				.select("*")
				.from("users")
				.where("age", ">", 30)
				.where("active", "=", true)
				.build();

			t.assert.deepStrictEqual(query, {
				params: [30, true],
				sql: "SELECT * FROM users WHERE age > ? AND active = ?",
			});
		});

		it("should preserve params across join", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder
				.select("*")
				.from("users")
				.where("id", "=", "123")
				.join("orders", "users.id = orders.user_id")
				.build();

			t.assert.deepStrictEqual(query, {
				params: ["123"],
				sql: "SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id WHERE id = ?",
			});
		});

		it("should keep previously provided clauses when calling select on a preconfigured builder", (t: TestContext) => {
			t.plan(1);
			const preconfigured = new ScreamQueryBuilder(
				[new FromExpression("users"), new WhereExpression("id", "=")],
				["42"],
			);

			const query = preconfigured.select("name").build();

			t.assert.deepStrictEqual(query, {
				params: ["42"],
				sql: "SELECT name FROM users WHERE id = ?",
			});
		});

		it("should not mutate the original builder when changing selected columns", (t: TestContext) => {
			t.plan(2);
			const builder = new ScreamQueryBuilder();

			const selectName = builder.select("name");
			const selectAge = builder.select("age");

			t.assert.deepStrictEqual(selectName.build(), {
				params: [],
				sql: "SELECT name",
			});
			t.assert.deepStrictEqual(selectAge.build(), {
				params: [],
				sql: "SELECT age",
			});
		});

		it("should insert JOIN before GROUP BY even if join() is called later", (t: TestContext) => {
			t.plan(1);

			const builder = new ScreamQueryBuilder();
			const query = builder
				.select("*")
				.from("users")
				.groupBy("age")
				.join("orders", "users.id = orders.user_id")
				.build();

			t.assert.deepStrictEqual(query, {
				params: [],
				sql: "SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id GROUP BY age",
			});
		});
	});

	describe("insert", () => {
		it("should build an INSERT query", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder.insert("users", { id: 1, name: "Alice" }).build();

			t.assert.deepStrictEqual(query, {
				params: [1, "Alice"],
				sql: "INSERT INTO users (id, name) VALUES (?, ?)",
			});
		});

		it("should parameterize values instead of interpolating them for INSERT", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder
				.insert("users", { age: 21, name: "O'Reilly" })
				.build();

			t.assert.deepStrictEqual(query, {
				params: [21, "O'Reilly"],
				sql: "INSERT INTO users (age, name) VALUES (?, ?)",
			});
		});

		it("should produce deterministic column order for INSERT regardless of object key order", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();

			const q1 = builder.insert("users", { age: 21, name: "Bob" }).build();
			const q2 = builder.insert("users", { age: 21, name: "Bob" }).build();

			t.assert.deepStrictEqual(q1, q2);
		});

		it("should isolate INSERT params from previously scoped params", (t: TestContext) => {
			t.plan(1);
			const scopedBuilder = new ScreamQueryBuilder(
				[new FromExpression("users"), new WhereExpression("tenant_id", "=")],
				["tenant-42"],
			);

			const insertQuery = scopedBuilder
				.insert("audit_log", { action: "login" })
				.build();

			t.assert.deepStrictEqual(insertQuery, {
				params: ["login"],
				sql: "INSERT INTO audit_log (action) VALUES (?)",
			});
		});

		it("should not leak FROM/WHERE scope into INSERT queries when using a scoped builder", (t: TestContext) => {
			t.plan(1);

			const scopedBuilder = new ScreamQueryBuilder(
				[new FromExpression("users"), new WhereExpression("tenant_id", "=")],
				["tenant-42"],
			);

			const query = scopedBuilder
				.insert("audit_log", { action: "login" })
				.build();

			t.assert.deepStrictEqual(query, {
				params: ["login"],
				sql: "INSERT INTO audit_log (action) VALUES (?)",
			});
		});
	});

	describe("update", () => {
		it("should build an UPDATE query", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder.update("users", { age: 30, name: "Alice" }).build();

			t.assert.deepStrictEqual(query, {
				params: [30, "Alice"],
				sql: "UPDATE users SET age = ?, name = ?",
			});
		});

		it("should parameterize values instead of interpolating them for UPDATE", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder.update("users", { age: 30, name: "Alice" }).build();

			t.assert.deepStrictEqual(query, {
				params: [30, "Alice"],
				sql: "UPDATE users SET age = ?, name = ?",
			});
		});

		it("should parameterize UPDATE with WHERE clause and merge params in order", (t: TestContext) => {
			t.plan(1);

			const scopedBuilder = new ScreamQueryBuilder(
				[new FromExpression("users"), new WhereExpression("tenant_id", "=")],
				["tenant-42"],
			);

			const query = scopedBuilder.update("users", { active: false }).build();

			t.assert.deepStrictEqual(query, {
				params: [false, "tenant-42"],
				sql: "UPDATE users SET active = ? WHERE tenant_id = ?",
			});
		});

		it("should preserve existing params when cloning a builder for UPDATE", (t: TestContext) => {
			t.plan(1);

			const scopedBuilder = new ScreamQueryBuilder(
				[new FromExpression("users"), new WhereExpression("tenant_id", "=")],
				["tenant-42"],
			);

			const updateQuery = scopedBuilder
				.update("users", { last_login_at: "2025-01-01" })
				.build();

			t.assert.deepStrictEqual(updateQuery, {
				params: ["2025-01-01", "tenant-42"],
				sql: "UPDATE users SET last_login_at = ? WHERE tenant_id = ?",
			});
		});

		it("should keep multiple WHERE conditions when updating from a scoped builder", (t: TestContext) => {
			t.plan(1);

			const scoped = new ScreamQueryBuilder(
				[
					new FromExpression("users"),
					new WhereExpression("tenant_id", "="),
					new WhereExpression("active", "=", "AND"),
				],
				["tenant-42", true],
			);

			const query = scoped
				.update("users", { last_login_at: "2025-01-01" })
				.build();

			t.assert.deepStrictEqual(query, {
				params: ["2025-01-01", "tenant-42", true],
				sql: "UPDATE users SET last_login_at = ? WHERE tenant_id = ? AND active = ?",
			});
		});
	});

	describe("delete", () => {
		it("should build a DELETE query", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();
			const query = builder.delete("users").build();

			t.assert.deepStrictEqual(query, { params: [], sql: "DELETE FROM users" });
		});

		it("should parameterize DELETE with WHERE clause", (t: TestContext) => {
			t.plan(1);

			const scopedBuilder = new ScreamQueryBuilder(
				[new FromExpression("users"), new WhereExpression("id", "=")],
				["123"],
			);

			const query = scopedBuilder.delete("users").build();

			t.assert.deepStrictEqual(query, {
				params: ["123"],
				sql: "DELETE FROM users WHERE id = ?",
			});
		});

		it("should preserve existing params when cloning a builder for DELETE", (t: TestContext) => {
			t.plan(1);

			const scopedBuilder = new ScreamQueryBuilder(
				[
					new FromExpression("users"),
					new WhereExpression("tenant_id", "="),
					new WhereExpression("active", "=", "AND"),
				],
				["tenant-42", true],
			);

			const deleteQuery = scopedBuilder.delete("users").build();

			t.assert.deepStrictEqual(deleteQuery, {
				params: ["tenant-42", true],
				sql: "DELETE FROM users WHERE tenant_id = ? AND active = ?",
			});
		});
	});

	describe("safety", () => {
		it("should never interpolate dangerous values into SQL text", (t: TestContext) => {
			t.plan(1);
			const builder = new ScreamQueryBuilder();

			const evil = "Robert'); DROP TABLE users;--";
			const query = builder.insert("users", { name: evil }).build();

			t.assert.deepStrictEqual(query, {
				params: [evil],
				sql: "INSERT INTO users (name) VALUES (?)",
			});
		});
	});
});
