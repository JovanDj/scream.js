import { describe, it, type TestContext } from "node:test";
import { sql } from "../query-builder/sql-template-string.js";
import { SqliteConnection } from "./sqlite-connection.js";

describe("SqliteDatabase", { concurrency: true }, () => {
	const withConnection = async () => {
		const connection = await SqliteConnection.connect({ database: ":memory:" });
		const cleanup = async () => {
			await connection.close();
		};

		return { cleanup, connection };
	};

	describe("CRUD", () => {
		it("finds all rows", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT);`,
				);
				await connection.run(sql`INSERT INTO users VALUES (${["1"]})`);

				const users = await connection.all(sql`SELECT * FROM users;`);

				t.assert.deepStrictEqual(users, [{ id: 1 }]);
			} finally {
				await cleanup();
			}
		});

		it("finds single row", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT);`,
				);
				await connection.run(sql`INSERT INTO users VALUES (${["1"]})`);

				const user = await connection.get(sql`SELECT * FROM users;`);

				t.assert.deepStrictEqual(user, { id: 1 });
			} finally {
				await cleanup();
			}
		});

		it("creates a new row", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT);`,
				);
				await connection.run(sql`INSERT INTO users (id) VALUES (${["1"]})`);

				const user = await connection.get(
					sql`SELECT * FROM users WHERE id = ${"1"};`,
				);

				t.assert.deepStrictEqual(user, { id: 1 });
			} finally {
				await cleanup();
			}
		});

		it("updates a row", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT);`,
				);
				await connection.run(
					sql`INSERT INTO users (id, name) VALUES (${["1", "Alice"]})`,
				);

				await connection.run(
					sql`UPDATE users SET name = ${"Bob"} WHERE id = ${"1"};`,
				);

				const user = await connection.get(
					sql`SELECT * FROM users WHERE id = ${"1"};`,
				);

				t.assert.deepStrictEqual(user, { id: 1, name: "Bob" });
			} finally {
				await cleanup();
			}
		});

		it("deletes a row", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT);`,
				);
				await connection.run(
					sql`INSERT INTO users (id, name) VALUES (${["1", "Alice"]})`,
				);

				await connection.run(sql`DELETE FROM users WHERE id = ${"1"};`);

				const user = await connection.get(
					sql`SELECT * FROM users WHERE id = ${"1"};`,
				);

				t.assert.deepStrictEqual(user, undefined);
			} finally {
				await cleanup();
			}
		});
	});

	describe("Transactions", () => {
		it("commits a transaction successfully", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			try {
				await connection.run(
					sql`CREATE TABLE test (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT);`,
				);

				await connection.transaction(async (trx) => {
					await trx.run(
						sql`INSERT INTO test (id, name) VALUES (${["1", "Alice"]})`,
					);
				});

				const row = await connection.get(
					sql`SELECT * FROM test WHERE id = ${"1"};`,
				);
				t.assert.deepStrictEqual(row, { id: 1, name: "Alice" });
			} finally {
				await cleanup();
			}
		});

		it("rolls back a transaction on error", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			try {
				await connection.run(
					sql`CREATE TABLE test (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT);`,
				);

				try {
					await connection.transaction(async (trx) => {
						await trx.run(
							sql`INSERT INTO test (id, name) VALUES (${["1", "Alice"]})`,
						);
						throw new Error("Forced error to rollback transaction");
					});
				} catch (_error) {
					// error expected
				}

				const row = await connection.get(
					sql`SELECT * FROM test WHERE id = ${"1"};`,
				);
				t.assert.deepStrictEqual(row, undefined);
			} finally {
				await cleanup();
			}
		});

		it("returns data from a successful transaction", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			try {
				await connection.run(
					sql`CREATE TABLE test (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT);`,
				);

				const result = await connection.transaction(async (trx) => {
					await trx.run(sql`INSERT INTO test (name) VALUES (${"test name"})`);

					const data = await trx.get<{ id: number; name: string }>(
						sql`SELECT * FROM test WHERE name = ${"test name"};`,
					);

					return data;
				});

				t.assert.deepStrictEqual(result, { id: 1, name: "test name" });
			} finally {
				await cleanup();
			}
		});

		it("returns computed result from a transaction", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			try {
				const sum = await connection.transaction(async (trx) => {
					await trx.run(sql`CREATE TABLE numbers (num INTEGER);`);
					await trx.run(sql`INSERT INTO numbers (num) VALUES (${["5"]})`);
					await trx.run(sql`INSERT INTO numbers (num) VALUES (${["10"]})`);

					const rows = await trx.all<{ num: number }>(
						sql`SELECT num FROM numbers;`,
					);

					return rows.reduce((acc, row) => acc + row.num, 0);
				});

				t.assert.deepStrictEqual(sum, 15);
			} finally {
				await cleanup();
			}
		});
	});
});
